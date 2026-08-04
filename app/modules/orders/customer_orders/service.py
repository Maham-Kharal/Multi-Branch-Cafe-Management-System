from typing import List
from fastapi import HTTPException, status

from app.common.enums import OrderStatus
from app.core.permissions import TokenData
from app.modules.menu.branch_menu.repository import BranchMenuRepository
from app.modules.orders.customer_orders.models import Order, OrderItem
from app.modules.orders.customer_orders.repository import OrderRepository
from app.modules.orders.customer_orders.schemas import CreateOrderRequest, OrderResponse, UpdateOrderStatusRequest


class OrderService:
    VALID_TRANSITIONS = {
        OrderStatus.PENDING: [OrderStatus.IN_PREPARATION, OrderStatus.CANCELLED],
        OrderStatus.IN_PREPARATION: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        OrderStatus.COMPLETED: [],
        OrderStatus.CANCELLED: [],
    }

    def __init__(self, repo: OrderRepository, branch_menu_repo: BranchMenuRepository):
        self.repo = repo
        self.branch_menu_repo = branch_menu_repo

    def create_customer_order(self, user: TokenData, req: CreateOrderRequest) -> OrderResponse:
        if not req.items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must contain at least one item")

        order_items = []
        total_amount = 0.0

        for line_item in req.items:
            menu_item = self.branch_menu_repo.get_by_id(line_item.branch_menu_item_id)
            if not menu_item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Branch menu item {line_item.branch_menu_item_id} not found",
                )

            # Stock & Availability Constraint Check
            if not menu_item.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Item '{menu_item.name}' is currently out of stock or disabled at this branch",
                )

            # Financial Snapshot calculation
            unit_price = menu_item.effective_price
            subtotal = unit_price * line_item.quantity
            total_amount += subtotal

            order_items.append(
                OrderItem(
                    branch_menu_item_id=menu_item.id,
                    item_name_snapshot=menu_item.name,
                    unit_price_snapshot=unit_price,
                    quantity=line_item.quantity,
                    subtotal=subtotal,
                )
            )

        order = Order(
            branch_id=req.branch_id,
            customer_id=user.user_id,
            order_type=req.order_type,
            status=OrderStatus.PENDING,
            total_amount=total_amount,
            items=order_items,
        )

        created = self.repo.create(order)
        return OrderResponse.model_validate(created)

    def update_order_status(self, order_id: str, new_status: OrderStatus) -> OrderResponse:
        order = self.repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        # State Machine Transition Validation
        allowed_next = self.VALID_TRANSITIONS.get(order.status, [])
        if new_status not in allowed_next:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid state transition from {order.status.value} to {new_status.value}. Allowed next states: {[s.value for s in allowed_next]}",
            )

        order.status = new_status
        updated = self.repo.update(order)
        return OrderResponse.model_validate(updated)

    def get_customer_orders(self, customer_id: str) -> List[OrderResponse]:
        orders = self.repo.get_by_customer(customer_id)
        return [OrderResponse.model_validate(o) for o in orders]

    def get_branch_orders(self, branch_id: str) -> List[OrderResponse]:
        orders = self.repo.get_by_branch(branch_id)
        return [OrderResponse.model_validate(o) for o in orders]
