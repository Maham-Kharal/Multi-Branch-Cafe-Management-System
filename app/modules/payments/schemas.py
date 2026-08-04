from typing import Optional
from pydantic import BaseModel, Field
from app.common.enums import PaymentMethod, PaymentStatus


class ProcessPaymentRequest(BaseModel):
    order_id: str
    amount: float = Field(..., gt=0)
    method: PaymentMethod = PaymentMethod.CASH
    transaction_reference: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    order_id: str
    amount: float
    method: PaymentMethod
    status: PaymentStatus
    transaction_reference: Optional[str] = None

    class Config:
        from_attributes = True
