from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import TokenData, require_branch_staff
from app.modules.orders.customer_orders.repository import OrderRepository
from app.modules.payments.repository import PaymentRepository
from app.modules.payments.schemas import PaymentResponse, ProcessPaymentRequest
from app.modules.payments.service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payment Processing"])


def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    repo = PaymentRepository(db)
    order_repo = OrderRepository(db)
    return PaymentService(repo, order_repo)


@router.post("/process", response_model=PaymentResponse, status_code=201)
def process_order_payment(
    req: ProcessPaymentRequest,
    current_staff: TokenData = Depends(require_branch_staff),
    service: PaymentService = Depends(get_payment_service),
):
    """
    Branch Staff endpoint to process payment for an in-house or completed order.
    """
    return service.process_payment(req)
