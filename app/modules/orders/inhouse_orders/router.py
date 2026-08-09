from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import TokenData, require_branch_staff
from app.modules.menu.branch_menu.repository import BranchMenuRepository
from app.modules.orders.customer_orders.repository import OrderRepository
from app.modules.orders.customer_orders.schemas import OrderResponse
from app.modules.orders.inhouse_orders.schemas import CreateInHouseOrderRequest
from app.modules.orders.inhouse_orders.service import InHouseOrderService

router = APIRouter(prefix="/orders/inhouse", tags=["In-House POS & Live Branch Orders"])


def get_inhouse_order_service(db: Session = Depends(get_db)) -> InHouseOrderService:
    repo = OrderRepository(db)
    branch_menu_repo = BranchMenuRepository(db)
    return InHouseOrderService(repo, branch_menu_repo)


@router.post("", response_model=OrderResponse, status_code=201)
def place_inhouse_pos_order(
    req: CreateInHouseOrderRequest,
    current_staff: TokenData = Depends(require_branch_staff),
    service: InHouseOrderService = Depends(get_inhouse_order_service),
):
    """
    Branch Staff POS endpoint to place live in-house walk-in orders with immediate price snapshots.
    """
    return service.create_inhouse_order(staff=current_staff, req=req)


from typing import List, Optional
from app.core.permissions import TokenData, require_authenticated_user, require_branch_staff


@router.get("/live", response_model=List[OrderResponse])
def get_live_branch_orders(
    branch_id: Optional[str] = None,
    current_user: TokenData = Depends(require_authenticated_user),
    service: InHouseOrderService = Depends(get_inhouse_order_service),
):
    """
    Branch Staff / Café Owner / Super Admin endpoint to monitor live orders for physical branches.
    """
    return service.get_live_branch_orders(user=current_user, branch_id=branch_id)
