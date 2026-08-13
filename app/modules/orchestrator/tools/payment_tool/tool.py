from typing import Dict, Any
from sqlalchemy.orm import Session
from app.common.utils import generate_uuid


def execute_calculate_order_total(db: Session, subtotal: float, tax_rate: float = 0.08, tip_amount: float = 0.0) -> Dict[str, Any]:
    """
    Python code calculating final total.
    """
    tax = round(subtotal * tax_rate, 2)
    total = round(subtotal + tax + tip_amount, 2)
    return {
        "success": True,
        "subtotal": round(subtotal, 2),
        "tax": tax,
        "tip": round(tip_amount, 2),
        "total": total
    }


def execute_initiate_payment(db: Session, order_id: str, amount: float, payment_method: str = "CREDIT_CARD") -> Dict[str, Any]:
    """
    Python code processing checkout payment.
    """
    payment_id = generate_uuid()
    return {
        "success": True,
        "payment_id": payment_id,
        "order_id": order_id,
        "amount": amount,
        "payment_method": payment_method,
        "status": "COMPLETED",
        "message": f"Payment of ${amount:.2f} via {payment_method} successfully processed. Transaction ID: {payment_id}"
    }
