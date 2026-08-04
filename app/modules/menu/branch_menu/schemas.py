from typing import Optional
from pydantic import BaseModel, Field


class BranchMenuItemCreate(BaseModel):
    branch_id: str
    master_menu_item_id: Optional[str] = Field(None, description="Optional parent master catalog item to copy/inherit from")
    name: str
    category: str
    price_override: Optional[float] = Field(None, description="Location and demand specific custom price override")
    is_available: bool = True


class BranchMenuItemUpdate(BaseModel):
    price_override: Optional[float] = None
    is_available: Optional[bool] = None


class BranchMenuItemResponse(BaseModel):
    id: str
    branch_id: str
    master_menu_item_id: Optional[str] = None
    name: str
    category: str
    price_override: Optional[float] = None
    effective_price: float
    is_available: bool

    class Config:
        from_attributes = True
