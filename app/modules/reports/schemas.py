from typing import List, Optional
from pydantic import BaseModel


class BranchSalesReport(BaseModel):
    branch_id: str
    branch_name: str
    total_orders: int
    total_revenue: float


class CrossBranchAggregateReport(BaseModel):
    tenant_id: str
    tenant_name: str
    total_branches: int
    total_orders: int
    total_revenue: float
    branch_breakdown: List[BranchSalesReport]
