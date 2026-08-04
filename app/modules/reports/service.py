from typing import List
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.branches.models import Branch
from app.modules.orders.customer_orders.models import Order
from app.modules.reports.schemas import BranchSalesReport, CrossBranchAggregateReport
from app.modules.users.super_admin.models import Tenant


class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def get_cross_branch_report(self, tenant_id: str) -> CrossBranchAggregateReport:
        tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant enterprise not found")

        branches = self.db.query(Branch).filter(Branch.tenant_id == tenant_id).all()
        branch_reports: List[BranchSalesReport] = []
        
        grand_total_orders = 0
        grand_total_revenue = 0.0

        for b in branches:
            orders_count = self.db.query(func.count(Order.id)).filter(Order.branch_id == b.id).scalar() or 0
            revenue = self.db.query(func.sum(Order.total_amount)).filter(Order.branch_id == b.id).scalar() or 0.0
            
            grand_total_orders += orders_count
            grand_total_revenue += revenue

            branch_reports.append(
                BranchSalesReport(
                    branch_id=b.id,
                    branch_name=b.name,
                    total_orders=orders_count,
                    total_revenue=revenue,
                )
            )

        return CrossBranchAggregateReport(
            tenant_id=tenant.id,
            tenant_name=tenant.name,
            total_branches=len(branches),
            total_orders=grand_total_orders,
            total_revenue=grand_total_revenue,
            branch_breakdown=branch_reports,
        )
