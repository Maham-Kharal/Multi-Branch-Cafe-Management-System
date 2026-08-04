from typing import List
from fastapi import HTTPException, status

from app.core.permissions import TokenData
from app.modules.menu.master_menu.models import MasterMenuItem
from app.modules.menu.master_menu.repository import MasterMenuRepository
from app.modules.menu.master_menu.schemas import MasterMenuItemCreate, MasterMenuItemResponse, MasterMenuItemUpdate


class MasterMenuService:
    def __init__(self, repo: MasterMenuRepository):
        self.repo = repo

    def create_item(self, user: TokenData, req: MasterMenuItemCreate) -> MasterMenuItemResponse:
        if not user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must belong to a tenant enterprise to define master menu items",
            )

        item = MasterMenuItem(
            tenant_id=user.tenant_id,
            name=req.name,
            description=req.description,
            category=req.category,
            base_price=req.base_price,
        )
        created = self.repo.create(item)
        return MasterMenuItemResponse.model_validate(created)

    def get_items_by_tenant(self, tenant_id: str) -> List[MasterMenuItemResponse]:
        items = self.repo.get_by_tenant(tenant_id)
        return [MasterMenuItemResponse.model_validate(i) for i in items]
