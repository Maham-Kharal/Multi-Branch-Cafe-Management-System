from typing import List, Optional
from pydantic import BaseModel, Field
from app.common.enums import OrderStatus, OrderType


class OrderItemCreate(BaseModel):
    branch_menu_item_id: str
    quantity: int = Field(..., gt=0)


class CreateOrderRequest(BaseModel):
    branch_id: str
    items: List[OrderItemCreate]
    order_type: OrderType = OrderType.CUSTOMER_ONLINE
    delivery_address: Optional[str] = None
    delivery_notes: Optional[str] = None


class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus


class OrderItemResponse(BaseModel):
    id: str
    branch_menu_item_id: Optional[str] = None
    item_name_snapshot: str
    unit_price_snapshot: float
    quantity: int
    subtotal: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: str
    branch_id: str
    customer_id: Optional[str] = None
    staff_id: Optional[str] = None
    order_type: OrderType
    status: OrderStatus
    total_amount: float
    delivery_address: Optional[str] = None
    delivery_notes: Optional[str] = None
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
