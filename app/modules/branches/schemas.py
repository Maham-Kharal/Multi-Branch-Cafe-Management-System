from typing import Optional
from pydantic import BaseModel


class BranchCreateRequest(BaseModel):
    name: str
    address: str
    city: str
    phone: Optional[str] = None


class BranchUpdateRequest(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class BranchResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    address: str
    city: str
    phone: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
