from typing import Optional
from sqlalchemy.orm import Session
from app.modules.users.super_admin.models import User


class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_customer_by_id(self, customer_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == customer_id).first()
