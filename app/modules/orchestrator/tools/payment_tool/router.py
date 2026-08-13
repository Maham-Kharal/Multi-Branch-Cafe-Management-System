from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.orchestrator.tools.payment_tool.schemas import PaymentCalculationInput, InitiatePaymentInput
from app.modules.orchestrator.tools.payment_tool.tool import execute_calculate_order_total, execute_initiate_payment

router = APIRouter(prefix="/orchestrator/tools/payment", tags=["Payment Tool"])


@router.post("/calculate")
def calculate_total(data: PaymentCalculationInput, db: Session = Depends(get_db)):
    """REST endpoint to test payment calculation tool directly."""
    return execute_calculate_order_total(
        db,
        subtotal=data.subtotal,
        tax_rate=data.tax_rate or 0.08,
        tip_amount=data.tip_amount or 0.0
    )


@router.post("/pay")
def initiate_payment(data: InitiatePaymentInput, db: Session = Depends(get_db)):
    """REST endpoint to test payment checkout tool directly."""
    return execute_initiate_payment(
        db,
        order_id=data.order_id,
        amount=data.amount,
        payment_method=data.payment_method or "CREDIT_CARD"
    )
