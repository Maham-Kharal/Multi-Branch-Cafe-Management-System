from typing import List, Optional
from sqlalchemy.orm import Session

from app.common.enums import UserRole
from app.modules.users.super_admin.models import User


class BranchOwnerUserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_tenant_users(self, tenant_id: str, role: Optional[UserRole] = None) -> List[User]:
        query = self.db.query(User).filter(User.tenant_id == tenant_id)
        if role:
            query = query.filter(User.role == role)
        return query.all()

    def create_staff(self, staff_user: User) -> User:
        self.db.add(staff_user)
        self.db.commit()
        self.db.refresh(staff_user)
        return staff_user
