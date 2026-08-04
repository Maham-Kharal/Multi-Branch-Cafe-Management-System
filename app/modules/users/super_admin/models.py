from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, ForeignKey, String
from sqlalchemy.orm import relationship

from app.common.enums import UserRole
from app.common.utils import generate_uuid, utc_now
from app.core.database import Base


class Tenant(Base):
    """
    Represents a Café Enterprise / Franchise entity owned by a Café Owner.
    Managed globally by Super Admin.
    """
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    branches = relationship("Branch", back_populates="tenant", cascade="all, delete-orphan")
    master_menu_items = relationship("MasterMenuItem", back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    """
    Unified User model representing Super Admins, Café Owners, Branch Staff, and Customers.
    """
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, nullable=False, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, index=True)
    
    # Scoped FKs
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    branch_id = Column(String, ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    branch = relationship("Branch", back_populates="staff_members")
