from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.common.utils import generate_uuid, utc_now
from app.core.database import Base


class Branch(Base):
    """
    Represents a physical Café Branch operating under a Tenant Enterprise.
    Managed by Café Owner; operated by Branch Staff.
    """
    __tablename__ = "branches"

    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="branches")
    staff_members = relationship("User", back_populates="branch")
    branch_menu_items = relationship("BranchMenuItem", back_populates="branch", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="branch", cascade="all, delete-orphan")
