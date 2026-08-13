from typing import Optional, List
from pydantic import BaseModel


class CartItem(BaseModel):
    item_name: str
    quantity: int = 1
    customizations: Optional[str] = None


class AddToCartInput(BaseModel):
    items: List[CartItem]
    branch_id: Optional[str] = None


class OrderStatusInput(BaseModel):
    order_id: str
