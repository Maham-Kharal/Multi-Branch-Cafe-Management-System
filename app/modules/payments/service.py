from fastapi import HTTPException, status

from app.common.enums import PaymentStatus
from app.modules.orders.customer_orders.repository import OrderRepository
from app.modules.payments.models import Payment
from app.modules.payments.repository import PaymentRepository
from app.modules.payments.schemas import PaymentResponse, ProcessPaymentRequest


class PaymentService:
    def __init__(self, repo: PaymentRepository, order_repo: OrderRepository):
        self.repo = repo
        self.order_repo = order_repo

    def process_payment(self, req: ProcessPaymentRequest) -> PaymentResponse:
        order = self.order_repo.get_by_id(req.order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        payment = Payment(
            order_id=req.order_id,
            amount=req.amount,
            method=req.method,
            status=PaymentStatus.COMPLETED,
            transaction_reference=req.transaction_reference,
        )
        created = self.repo.create(payment)
        return PaymentResponse.model_validate(created)
