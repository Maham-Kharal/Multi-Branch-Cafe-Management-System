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

    def update_item(self, item_id: str, user: TokenData, req: MasterMenuItemUpdate) -> MasterMenuItemResponse:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Master menu item not found")
        if item.tenant_id != user.tenant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to update this item")

        if req.name is not None:
            item.name = req.name
        if req.description is not None:
            item.description = req.description
        if req.category is not None:
            item.category = req.category
        if req.base_price is not None:
            item.base_price = req.base_price
        if req.is_active is not None:
            item.is_active = req.is_active

        updated = self.repo.update(item)
        return MasterMenuItemResponse.model_validate(updated)

    def delete_item(self, item_id: str, user: TokenData) -> None:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Master menu item not found")
        if item.tenant_id != user.tenant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to delete this item")

        self.repo.delete(item)
