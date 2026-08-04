from typing import Optional
from pydantic import BaseModel, EmailStr
from app.common.enums import UserRole


class CreateStaffRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    branch_id: str


class UpdateStaffRequest(BaseModel):
    full_name: Optional[str] = None
    branch_id: Optional[str] = None
    is_active: Optional[bool] = None


class TenantUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
