from typing import List
from fastapi import HTTPException, status

from app.common.enums import UserRole
from app.core.permissions import TokenData
from app.modules.branches.models import Branch
from app.modules.branches.repository import BranchRepository
from app.modules.branches.schemas import BranchCreateRequest, BranchResponse, BranchUpdateRequest


class BranchService:
    def __init__(self, repo: BranchRepository):
        self.repo = repo

    def create_branch(self, user: TokenData, req: BranchCreateRequest) -> BranchResponse:
        if not user.tenant_id and user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must belong to a tenant enterprise to create a branch",
            )

        branch = Branch(
            tenant_id=user.tenant_id,
            name=req.name,
            address=req.address,
            city=req.city,
            phone=req.phone,
        )
        created = self.repo.create_branch(branch)
        return BranchResponse.model_validate(created)

    def get_branches(self, user: TokenData) -> List[BranchResponse]:
        if user.role == UserRole.SUPER_ADMIN or user.role == UserRole.CUSTOMER or not user.tenant_id:
            branches = self.repo.get_all_branches()
        else:
            branches = self.repo.get_branches_by_tenant(user.tenant_id)
        return [BranchResponse.model_validate(b) for b in branches]

    def get_public_branches(self) -> List[BranchResponse]:
        branches = self.repo.get_all_branches()
        return [BranchResponse.model_validate(b) for b in branches if b.is_active]

    def get_branch_by_id(self, branch_id: str, user: TokenData) -> BranchResponse:
        branch = self.repo.get_branch_by_id(branch_id)
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branch not found",
            )
        
        if user.role != UserRole.SUPER_ADMIN and branch.tenant_id != user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this branch",
            )

        return BranchResponse.model_validate(branch)

    def update_branch(self, branch_id: str, user: TokenData, req: BranchUpdateRequest) -> BranchResponse:
        branch = self.repo.get_branch_by_id(branch_id)
        if not branch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
        if user.role != UserRole.SUPER_ADMIN and branch.tenant_id != user.tenant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to update this branch")

        if req.name is not None:
            branch.name = req.name
        if req.address is not None:
            branch.address = req.address
        if req.city is not None:
            branch.city = req.city
        if req.phone is not None:
            branch.phone = req.phone
        if req.is_active is not None:
            branch.is_active = req.is_active

        updated = self.repo.update_branch(branch)
        return BranchResponse.model_validate(updated)

    def delete_branch(self, branch_id: str, user: TokenData) -> None:
        branch = self.repo.get_branch_by_id(branch_id)
        if not branch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
        if user.role != UserRole.SUPER_ADMIN and branch.tenant_id != user.tenant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to delete this branch")

        self.repo.delete_branch(branch)
