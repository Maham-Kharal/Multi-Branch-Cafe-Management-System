from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.orchestrator.tools.menu_tool.schemas import MenuSearchInput
from app.modules.orchestrator.tools.menu_tool.tool import execute_search_menu_items

router = APIRouter(prefix="/orchestrator/tools/menu", tags=["Menu Tool"])


@router.post("/search")
def search_menu(data: MenuSearchInput, db: Session = Depends(get_db)):
    """REST endpoint to test menu search tool directly."""
    return execute_search_menu_items(
        db,
        query=data.query or "",
        category=data.category or "",
        branch_id=data.branch_id or ""
    )
