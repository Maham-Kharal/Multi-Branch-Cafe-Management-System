from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.modules.orders.customer_orders.models import Order, OrderItem


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, order_id: str) -> Optional[Order]:
        return self.db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()

    def get_by_branch(self, branch_id: str) -> List[Order]:
        return self.db.query(Order).options(joinedload(Order.items)).filter(Order.branch_id == branch_id).order_by(Order.created_at.desc()).all()

    def get_by_customer(self, customer_id: str) -> List[Order]:
        return self.db.query(Order).options(joinedload(Order.items)).filter(Order.customer_id == customer_id).order_by(Order.created_at.desc()).all()

    def create(self, order: Order) -> Order:
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def update(self, order: Order) -> Order:
        self.db.commit()
        self.db.refresh(order)
        return order
