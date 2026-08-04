from typing import List
from fastapi import HTTPException, status

from app.common.enums import OrderStatus, OrderType
from app.core.permissions import TokenData
from app.modules.menu.branch_menu.repository import BranchMenuRepository
from app.modules.orders.customer_orders.models import Order, OrderItem
from app.modules.orders.customer_orders.repository import OrderRepository
from app.modules.orders.customer_orders.schemas import OrderResponse
from app.modules.orders.inhouse_orders.schemas import CreateInHouseOrderRequest


class InHouseOrderService:
    def __init__(self, repo: OrderRepository, branch_menu_repo: BranchMenuRepository):
        self.repo = repo
        self.branch_menu_repo = branch_menu_repo

    def create_inhouse_order(self, staff: TokenData, req: CreateInHouseOrderRequest) -> OrderResponse:
        if not staff.branch_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Branch staff member must be assigned to a branch to create POS in-house orders",
            )

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

            if not menu_item.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Item '{menu_item.name}' is currently out of stock or disabled at this branch",
                )

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
            branch_id=staff.branch_id,
            staff_id=staff.user_id,
            customer_id=req.customer_id,
            order_type=OrderType.INHOUSE,
            status=OrderStatus.PENDING,
            total_amount=total_amount,
            items=order_items,
        )

        created = self.repo.create(order)
        return OrderResponse.model_validate(created)

    def get_live_branch_orders(self, branch_id: str) -> List[OrderResponse]:
        orders = self.repo.get_by_branch(branch_id)
        return [OrderResponse.model_validate(o) for o in orders]
