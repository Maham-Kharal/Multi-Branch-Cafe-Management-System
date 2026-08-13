from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.orchestrator.tools.branch_tool.schemas import BranchSearchInput, SelectBranchInput
from app.modules.orchestrator.tools.branch_tool.tool import execute_list_branches, execute_select_branch

router = APIRouter(prefix="/orchestrator/tools/branch", tags=["Branch Tool"])


@router.post("/list")
def list_branches(data: BranchSearchInput, db: Session = Depends(get_db)):
    """REST endpoint to test branch list tool directly."""
    return execute_list_branches(db, city=data.city or "")


@router.post("/select")
def select_branch(data: SelectBranchInput, db: Session = Depends(get_db)):
    """REST endpoint to test branch select tool directly."""
    return execute_select_branch(db, branch_id=data.branch_id)
