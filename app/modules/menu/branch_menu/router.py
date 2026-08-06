from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import TokenData, require_authenticated_user, require_branch_staff, require_cafe_owner
from app.modules.menu.branch_menu.repository import BranchMenuRepository
from app.modules.menu.branch_menu.schemas import BranchMenuItemCreate, BranchMenuItemResponse, BranchMenuItemUpdate
from app.modules.menu.branch_menu.service import BranchMenuService
from app.modules.menu.master_menu.repository import MasterMenuRepository

router = APIRouter(prefix="/menu/branch", tags=["Branch Menu & Location Pricing"])


def get_branch_menu_service(db: Session = Depends(get_db)) -> BranchMenuService:
    repo = BranchMenuRepository(db)
    master_repo = MasterMenuRepository(db)
    return BranchMenuService(repo, master_repo)


@router.post("", response_model=BranchMenuItemResponse, status_code=201)
def add_item_to_branch_menu(
    req: BranchMenuItemCreate,
    current_user: TokenData = Depends(require_cafe_owner),
    service: BranchMenuService = Depends(get_branch_menu_service),
):
    """
    Café Owner / Manager endpoint to offer a master catalog item or custom item at a specific branch with location-based pricing.
    """
    return service.add_branch_item(req)


@router.patch("/{item_id}", response_model=BranchMenuItemResponse)
def update_branch_menu_item(
    item_id: str,
    req: BranchMenuItemUpdate,
    current_user: TokenData = Depends(require_branch_staff),
    service: BranchMenuService = Depends(get_branch_menu_service),
):
    """
    Branch Staff / Owner endpoint to update price override or toggle stock availability (In Stock / Disabled).
    """
    return service.update_branch_item(item_id, req)


@router.get("/{branch_id}", response_model=List[BranchMenuItemResponse])
def get_branch_menu(
    branch_id: str,
    user: TokenData = Depends(require_authenticated_user),
    service: BranchMenuService = Depends(get_branch_menu_service),
):
    """
    Public / Customer / Staff endpoint to view active menu items and pricing for a specific branch.
    """
    return service.get_branch_menu(branch_id)
