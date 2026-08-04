from typing import List, Optional
from pydantic import BaseModel
from app.common.enums import OrderType
from app.modules.orders.customer_orders.schemas import OrderItemCreate, OrderResponse


class CreateInHouseOrderRequest(BaseModel):
    items: List[OrderItemCreate]
    customer_id: Optional[str] = None  # Optional customer reference for walk-in or table order
