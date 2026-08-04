from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.common.enums import UserRole
from app.modules.branches.models import Branch
from app.modules.orders.customer_orders.models import Order
from app.modules.users.super_admin.models import Tenant, User


class SuperAdminRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_tenants(self) -> List[Tenant]:
        return self.db.query(Tenant).all()

    def get_all_users(self, role: Optional[UserRole] = None) -> List[User]:
        query = self.db.query(User)
        if role:
            query = query.filter(User.role == role)
        return query.all()

    def get_all_branches(self) -> List[Branch]:
        return self.db.query(Branch).all()

    def get_global_telemetry(self) -> dict:
        total_tenants = self.db.query(func.count(Tenant.id)).scalar() or 0
        total_branches = self.db.query(func.count(Branch.id)).scalar() or 0
        total_users = self.db.query(func.count(User.id)).scalar() or 0
        total_owners = self.db.query(func.count(User.id)).filter(User.role == UserRole.CAFE_OWNER).scalar() or 0
        total_staff = self.db.query(func.count(User.id)).filter(User.role == UserRole.BRANCH_STAFF).scalar() or 0
        total_customers = self.db.query(func.count(User.id)).filter(User.role == UserRole.CUSTOMER).scalar() or 0
        total_orders = self.db.query(func.count(Order.id)).scalar() or 0
        total_revenue = self.db.query(func.sum(Order.total_amount)).scalar() or 0.0

        return {
            "total_tenants": total_tenants,
            "total_branches": total_branches,
            "total_users": total_users,
            "total_owners": total_owners,
            "total_staff": total_staff,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
        }
