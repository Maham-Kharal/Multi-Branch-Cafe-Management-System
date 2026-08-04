from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import relationship

from app.common.utils import generate_uuid, utc_now
from app.core.database import Base


class BranchMenuItem(Base):
    """
    Branch-Specific Menu Item offering location-based custom pricing and availability toggles.
    Can be linked to a MasterMenuItem or independently created per branch.
    """
    __tablename__ = "branch_menu_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    branch_id = Column(String, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    master_menu_item_id = Column(String, ForeignKey("master_menu_items.id", ondelete="SET NULL"), nullable=True, index=True)
    
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    price_override = Column(Float, nullable=True)  # If set, overrides master base_price
    is_available = Column(Boolean, default=True, nullable=False)  # Stock / Disabled toggle
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="branch_menu_items")
    master_menu_item = relationship("MasterMenuItem", back_populates="branch_overrides")

    @property
    def effective_price(self) -> float:
        """Returns price_override if set, otherwise falls back to master base_price."""
        if self.price_override is not None:
            return self.price_override
        if self.master_menu_item is not None:
            return self.master_menu_item.base_price
        return 0.0
