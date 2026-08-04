from typing import List, Optional
from pydantic import BaseModel
from app.common.enums import UserRole


class TenantResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class GlobalTelemetryResponse(BaseModel):
    total_tenants: int
    total_branches: int
    total_users: int
    total_owners: int
    total_staff: int
    total_customers: int
    total_orders: int
    total_revenue: float
