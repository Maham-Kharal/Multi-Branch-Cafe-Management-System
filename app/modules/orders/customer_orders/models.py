from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.common.enums import OrderStatus, OrderType
from app.common.utils import generate_uuid, utc_now
from app.core.database import Base


class Order(Base):
    """
    Represents an Order placed either online by a Customer or in-house by Branch Staff.
    Tracks state machine status transitions and total financial value.
    """
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=generate_uuid)
    branch_id = Column(String, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    staff_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    order_type = Column(SQLEnum(OrderType), nullable=False, default=OrderType.CUSTOMER_ONLINE, index=True)
    status = Column(SQLEnum(OrderStatus), nullable=False, default=OrderStatus.PENDING, index=True)
    total_amount = Column(Float, nullable=False, default=0.0)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    """
    Order Line Item storing frozen price and name snapshots to guarantee historical financial integrity.
    """
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_menu_item_id = Column(String, ForeignKey("branch_menu_items.id", ondelete="SET NULL"), nullable=True)
    
    # Financial snapshot fields
    item_name_snapshot = Column(String, nullable=False)
    unit_price_snapshot = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    subtotal = Column(Float, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
