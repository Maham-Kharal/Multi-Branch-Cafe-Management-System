from typing import Optional
from pydantic import BaseModel


class PaymentCalculationInput(BaseModel):
    subtotal: float
    tax_rate: Optional[float] = 0.08
    tip_amount: Optional[float] = 0.0


class InitiatePaymentInput(BaseModel):
    order_id: str
    amount: float
    payment_method: Optional[str] = "CREDIT_CARD"
