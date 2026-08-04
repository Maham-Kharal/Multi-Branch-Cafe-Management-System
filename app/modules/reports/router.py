from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import TokenData, require_cafe_owner
from app.modules.reports.schemas import CrossBranchAggregateReport
from app.modules.reports.service import ReportService

router = APIRouter(prefix="/reports", tags=["Cross-Branch Analytics & Reports"])


def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    return ReportService(db)


@router.get("/aggregate", response_model=CrossBranchAggregateReport)
def get_cross_branch_aggregate_report(
    current_owner: TokenData = Depends(require_cafe_owner),
    service: ReportService = Depends(get_report_service),
):
    """
    Café Owner endpoint to review aggregate sales, orders, and revenue breakdown across all branches.
    """
    return service.get_cross_branch_report(tenant_id=current_owner.tenant_id)
