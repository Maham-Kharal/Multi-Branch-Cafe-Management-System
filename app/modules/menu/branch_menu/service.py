from typing import List
from fastapi import HTTPException, status

from app.modules.menu.branch_menu.models import BranchMenuItem
from app.modules.menu.branch_menu.repository import BranchMenuRepository
from app.modules.menu.branch_menu.schemas import BranchMenuItemCreate, BranchMenuItemResponse, BranchMenuItemUpdate
from app.modules.menu.master_menu.repository import MasterMenuRepository


class BranchMenuService:
    def __init__(self, repo: BranchMenuRepository, master_repo: MasterMenuRepository):
        self.repo = repo
        self.master_repo = master_repo

    def add_branch_item(self, req: BranchMenuItemCreate) -> BranchMenuItemResponse:
        master_item = None
        if req.master_menu_item_id:
            master_item = self.master_repo.get_by_id(req.master_menu_item_id)

        item = BranchMenuItem(
            branch_id=req.branch_id,
            master_menu_item_id=req.master_menu_item_id,
            name=req.name if req.name else (master_item.name if master_item else "Menu Item"),
            category=req.category if req.category else (master_item.category if master_item else "General"),
            price_override=req.price_override,
            is_available=req.is_available,
        )
        created = self.repo.create(item)
        return BranchMenuItemResponse.model_validate(created)

    def update_branch_item(self, item_id: str, req: BranchMenuItemUpdate) -> BranchMenuItemResponse:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch menu item not found")

        if req.price_override is not None:
            item.price_override = req.price_override
        if req.is_available is not None:
            item.is_available = req.is_available

        updated = self.repo.update(item)
        return BranchMenuItemResponse.model_validate(updated)

    def get_branch_menu(self, branch_id: str) -> List[BranchMenuItemResponse]:
        items = self.repo.get_by_branch(branch_id)
        return [BranchMenuItemResponse.model_validate(i) for i in items]

    def delete_branch_item(self, item_id: str) -> None:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch menu item not found")
        self.repo.delete(item)
