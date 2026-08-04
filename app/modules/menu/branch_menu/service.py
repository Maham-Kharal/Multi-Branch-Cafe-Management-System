from typing import List
from fastapi import HTTPException, status

from app.common.enums import UserRole
from app.core.permissions import TokenData
from app.modules.branches.repository import BranchRepository
from app.modules.menu.branch_menu.models import BranchMenuItem
from app.modules.menu.branch_menu.repository import BranchMenuRepository
from app.modules.menu.branch_menu.schemas import BranchMenuItemCreate, BranchMenuItemResponse, BranchMenuItemUpdate
from app.modules.menu.master_menu.repository import MasterMenuRepository


class BranchMenuService:
    def __init__(self, repo: BranchMenuRepository, master_repo: MasterMenuRepository, branch_repo: BranchRepository):
        self.repo = repo
        self.master_repo = master_repo
        self.branch_repo = branch_repo

    def add_branch_item(self, user: TokenData, req: BranchMenuItemCreate) -> BranchMenuItemResponse:
        branch = self.branch_repo.get_branch_by_id(req.branch_id)
        if not branch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")

        # Tenant boundary check for user access
        if user.role != UserRole.SUPER_ADMIN and branch.tenant_id != user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot add menu items to a branch outside your café enterprise",
            )

        master_item = None
        if req.master_menu_item_id:
            master_item = self.master_repo.get_by_id(req.master_menu_item_id)
            if not master_item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Master menu item not found",
                )
            
            # Cross-Tenant Data Check: Ensure Master Item belongs to the EXACT SAME enterprise tenant as the Branch!
            if master_item.tenant_id != branch.tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cross-tenant error: Cannot assign a master menu item from another café enterprise to this branch",
                )

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

    def update_branch_item(self, item_id: str, user: TokenData, req: BranchMenuItemUpdate) -> BranchMenuItemResponse:
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch menu item not found")

        branch = self.branch_repo.get_branch_by_id(item.branch_id)
        if user.role != UserRole.SUPER_ADMIN and user.role == UserRole.CAFE_OWNER and branch.tenant_id != user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot modify menu items of a branch outside your café enterprise",
            )

        if req.price_override is not None:
            item.price_override = req.price_override
        if req.is_available is not None:
            item.is_available = req.is_available

        updated = self.repo.update(item)
        return BranchMenuItemResponse.model_validate(updated)

    def get_branch_menu(self, branch_id: str) -> List[BranchMenuItemResponse]:
        items = self.repo.get_by_branch(branch_id)
        return [BranchMenuItemResponse.model_validate(i) for i in items]
