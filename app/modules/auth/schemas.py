from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.common.enums import UserRole


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: UserRole = UserRole.CUSTOMER
    tenant_name: Optional[str] = Field(None, description="Required when creating a CAFE_OWNER to create their enterprise tenant")
    branch_id: Optional[str] = Field(None, description="Optional branch assignment for BRANCH_STAFF")
    role_passcode: Optional[str] = Field(None, description="Security passkey required for privileged roles")


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: UserRole
    tenant_id: Optional[str] = None
    branch_id: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    tenant_id: Optional[str] = None
    branch_id: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
