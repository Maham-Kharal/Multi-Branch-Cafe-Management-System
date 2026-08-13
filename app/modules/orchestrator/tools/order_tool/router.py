from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.orchestrator.tools.order_tool.schemas import AddToCartInput, OrderStatusInput
from app.modules.orchestrator.tools.order_tool.tool import execute_add_to_cart, execute_check_order_status

router = APIRouter(prefix="/orchestrator/tools/order", tags=["Order Tool"])


@router.post("/cart/add")
def add_to_cart(data: AddToCartInput, db: Session = Depends(get_db)):
    """REST endpoint to test add_to_cart tool directly."""
    items_dict = [i.model_dump() for i in data.items]
    return execute_add_to_cart(db, items=items_dict, branch_id=data.branch_id or "")


@router.post("/status")
def get_order_status(data: OrderStatusInput, db: Session = Depends(get_db)):
    """REST endpoint to test order status checking tool directly."""
    return execute_check_order_status(db, order_id=data.order_id)
