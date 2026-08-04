from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import relationship

from app.common.utils import generate_uuid, utc_now
from app.core.database import Base


class MasterMenuItem(Base):
    """
    Master Menu Item Catalog defined by the Café Owner at the Tenant Enterprise level.
    Serves as the parent template for branch-specific overrides.
    """
    __tablename__ = "master_menu_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    category = Column(String, nullable=False, index=True)
    base_price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="master_menu_items")
    branch_overrides = relationship("BranchMenuItem", back_populates="master_menu_item", cascade="all, delete-orphan")
