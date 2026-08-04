from typing import Optional
from pydantic import BaseModel, Field


class MasterMenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    base_price: float = Field(..., gt=0)


class MasterMenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    base_price: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None


class MasterMenuItemResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    category: str
    base_price: float
    is_active: bool

    class Config:
        from_attributes = True
