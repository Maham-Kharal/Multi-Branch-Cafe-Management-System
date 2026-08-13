from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.modules.menu.master_menu.models import MasterMenuItem
from app.modules.menu.branch_menu.models import BranchMenuItem
from app.modules.branches.models import Branch


def execute_search_menu_items(
    db: Session,
    query: str = "",
    category: str = "",
    branch_id: str = "",
    menu_type: str = "BRANCH"
) -> Dict[str, Any]:
    """
    Executes menu item queries against database BranchMenuItem and MasterMenuItem tables ONLY.
    Never invents or hardcodes sample prices.
    """
    try:
        items = []
        resolved_branch_name = None

        # Resolve branch by ID or name if provided
        target_branch_id = None
        if branch_id:
            branch_match = db.query(Branch).filter(
                (Branch.id == branch_id) | (Branch.name.ilike(f"%{branch_id}%"))
            ).first()
            if branch_match:
                target_branch_id = str(branch_match.id)
                resolved_branch_name = branch_match.name
            else:
                target_branch_id = branch_id

        # 1. Query BranchMenuItem (Branch Menu Table) first
        b_query = db.query(BranchMenuItem)
        if target_branch_id:
            b_query = b_query.filter(BranchMenuItem.branch_id == target_branch_id)
        if category:
            b_query = b_query.filter(BranchMenuItem.category.ilike(f"%{category}%"))
        if query:
            b_query = b_query.filter(BranchMenuItem.name.ilike(f"%{query}%"))

        branch_results = b_query.limit(20).all()

        for b_item in branch_results:
            b_name = b_item.branch.name if b_item.branch else (resolved_branch_name or "Branch Menu")
            items.append({
                "id": str(b_item.id),
                "name": b_item.name,
                "category": b_item.category,
                "price": float(b_item.effective_price),
                "is_available": b_item.is_available,
                "branch_id": str(b_item.branch_id),
                "branch_name": b_name,
                "menu_type": "BRANCH_MENU"
            })

        # 2. If no BranchMenuItem results found, query MasterMenuItem catalog
        if not items:
            m_query = db.query(MasterMenuItem)
            if category:
                m_query = m_query.filter(MasterMenuItem.category.ilike(f"%{category}%"))
            if query:
                m_query = m_query.filter(MasterMenuItem.name.ilike(f"%{query}%"))

            master_results = m_query.limit(20).all()

            for m_item in master_results:
                items.append({
                    "id": str(m_item.id),
                    "name": m_item.name,
                    "category": m_item.category,
                    "price": float(m_item.base_price),
                    "description": m_item.description or "",
                    "is_available": m_item.is_active,
                    "menu_type": "MASTER_CATALOG"
                })

        return {
            "success": True,
            "count": len(items),
            "branch_filter": resolved_branch_name or branch_id or "ALL",
            "items": items
        }
    except Exception as e:
        return {
            "success": False,
            "count": 0,
            "items": [],
            "error": str(e)
        }
