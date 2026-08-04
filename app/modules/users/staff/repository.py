from typing import Optional
from sqlalchemy.orm import Session
from app.modules.users.super_admin.models import User


class StaffRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_staff_by_id(self, staff_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == staff_id).first()
