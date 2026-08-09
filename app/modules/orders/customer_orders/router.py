from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import TokenData, require_authenticated_user, require_branch_staff
from app.modules.menu.branch_menu.repository import BranchMenuRepository
from app.modules.orders.customer_orders.repository import OrderRepository
from app.modules.orders.customer_orders.schemas import CreateOrderRequest, OrderResponse, UpdateOrderStatusRequest
from app.modules.orders.customer_orders.service import OrderService

router = APIRouter(prefix="/orders/customer", tags=["Customer Online Orders"])


def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    repo = OrderRepository(db)
    branch_menu_repo = BranchMenuRepository(db)
    return OrderService(repo, branch_menu_repo)


@router.post("", response_model=OrderResponse, status_code=201)
def place_customer_order(
    req: CreateOrderRequest,
    current_user: TokenData = Depends(require_authenticated_user),
    service: OrderService = Depends(get_order_service),
):
    """
    Customer endpoint to place an online order with price snapshots and availability checks.
    """
    return service.create_customer_order(user=current_user, req=req)


@router.get("/my-orders", response_model=List[OrderResponse])
def get_my_order_history(
    current_user: TokenData = Depends(require_authenticated_user),
    service: OrderService = Depends(get_order_service),
):
    """
    Customer endpoint to view personal online order history.
    """
    return service.get_customer_orders(current_user.user_id)


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_lifecycle_status(
    order_id: str,
    req: UpdateOrderStatusRequest,
    current_user: TokenData = Depends(require_authenticated_user),
    service: OrderService = Depends(get_order_service),
):
    """
    Endpoint for Branch Staff, Owners, and Customers to update order lifecycle status.
    """
    return service.update_order_status(order_id=order_id, new_status=req.status)
