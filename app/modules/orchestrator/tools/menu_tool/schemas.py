from typing import Optional, List
from pydantic import BaseModel


class MenuSearchInput(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    branch_id: Optional[str] = None


class MenuItemResult(BaseModel):
    id: str
    name: str
    category: str
    price: float
    description: Optional[str] = None
    is_available: bool = True
