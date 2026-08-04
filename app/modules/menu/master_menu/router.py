from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import TokenData, require_authenticated_user, require_cafe_owner
from app.modules.menu.master_menu.repository import MasterMenuRepository
from app.modules.menu.master_menu.schemas import MasterMenuItemCreate, MasterMenuItemResponse
from app.modules.menu.master_menu.service import MasterMenuService

router = APIRouter(prefix="/menu/master", tags=["Master Menu Catalog"])


def get_master_menu_service(db: Session = Depends(get_db)) -> MasterMenuService:
    repo = MasterMenuRepository(db)
    return MasterMenuService(repo)


@router.post("", response_model=MasterMenuItemResponse, status_code=201)
def create_master_menu_item(
    req: MasterMenuItemCreate,
    current_owner: TokenData = Depends(require_cafe_owner),
    service: MasterMenuService = Depends(get_master_menu_service),
):
    """
    Café Owner endpoint to create master catalog menu items for their enterprise.
    """
    return service.create_item(user=current_owner, req=req)


@router.get("/tenant/{tenant_id}", response_model=List[MasterMenuItemResponse])
def get_master_menu(
    tenant_id: str,
    user: TokenData = Depends(require_authenticated_user),
    service: MasterMenuService = Depends(get_master_menu_service),
):
    """
    Lists master menu catalog items for a given tenant enterprise.
    """
    return service.get_items_by_tenant(tenant_id)
