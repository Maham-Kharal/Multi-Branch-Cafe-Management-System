from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.common.enums import PaymentMethod, PaymentStatus
from app.common.utils import generate_uuid, utc_now
from app.core.database import Base


class Payment(Base):
    """
    Represents a payment transaction associated with an order.
    """
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    method = Column(SQLEnum(PaymentMethod), nullable=False, default=PaymentMethod.CASH)
    status = Column(SQLEnum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    transaction_reference = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="payments")
