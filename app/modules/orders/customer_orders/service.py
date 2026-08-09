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
        OrderStatus.PENDING: [OrderStatus.IN_PREPARATION, OrderStatus.CANCELLED, OrderStatus.COMPLETED, OrderStatus.DELIVERED],
        OrderStatus.IN_PREPARATION: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
        OrderStatus.COMPLETED: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        OrderStatus.DELIVERED: [],
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
                from app.modules.menu.master_menu.repository import MasterMenuRepository
                from app.modules.menu.branch_menu.models import BranchMenuItem
                
                master_repo = MasterMenuRepository(self.repo.db)
                master_item = master_repo.get_by_id(line_item.branch_menu_item_id)
                
                if not master_item:
                    all_master = master_repo.get_all_master_items()
                    for m in all_master:
                        if m.id == line_item.branch_menu_item_id or m.name.lower() == str(line_item.branch_menu_item_id).lower():
                            master_item = m
                            break

                if master_item:
                    new_branch_item = BranchMenuItem(
                        branch_id=req.branch_id,
                        master_menu_item_id=master_item.id,
                        name=master_item.name,
                        category=master_item.category,
                        price_override=master_item.base_price,
                        is_available=True,
                    )
                    menu_item = self.branch_menu_repo.create(new_branch_item)
                else:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Menu item {line_item.branch_menu_item_id} not found in catalog",
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

        from app.modules.users.super_admin.models import User
        existing_user = self.repo.db.query(User).filter(User.id == user.user_id).first()
        valid_customer_id = existing_user.id if existing_user else None

        order = Order(
            branch_id=req.branch_id,
            customer_id=valid_customer_id,
            order_type=req.order_type,
            status=OrderStatus.PENDING,
            total_amount=total_amount,
            delivery_address=req.delivery_address,
            delivery_notes=req.delivery_notes,
            items=order_items,
        )

        created = self.repo.create(order)

        # Automatically create transaction receipt record in payments table
        from app.modules.payments.models import Payment
        from app.common.enums import PaymentMethod, PaymentStatus
        from app.common.utils import generate_uuid

        payment_record = Payment(
            order_id=created.id,
            amount=created.total_amount,
            method=PaymentMethod.CASH,
            status=PaymentStatus.COMPLETED,
            transaction_reference=f"TXN-{generate_uuid()[:8].upper()}",
        )
        self.repo.db.add(payment_record)
        self.repo.db.commit()

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
