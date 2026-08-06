from typing import List, Optional
from fastapi import HTTPException, status

from app.common.enums import UserRole
from app.core.security import get_password_hash
from app.modules.auth.schemas import UserResponse
from app.modules.users.branch_owner.repository import BranchOwnerUserRepository
from app.modules.users.branch_owner.schemas import CreateStaffRequest
from app.modules.users.super_admin.models import User


class BranchOwnerUserService:
    def __init__(self, repo: BranchOwnerUserRepository):
        self.repo = repo

    def get_my_tenant_users(self, tenant_id: str, role: Optional[UserRole] = None) -> List[UserResponse]:
        if not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not associated with a Café Enterprise Tenant",
            )
        users = self.repo.get_tenant_users(tenant_id, role=role)
        return [UserResponse.model_validate(u) for u in users]

    def create_branch_staff(self, tenant_id: str, req: CreateStaffRequest) -> UserResponse:
        if not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Café Owner must belong to an enterprise tenant",
            )

        hashed_password = get_password_hash(req.password)
        new_staff = User(
            email=req.email,
            hashed_password=hashed_password,
            full_name=req.full_name,
            role=UserRole.BRANCH_STAFF,
            tenant_id=tenant_id,
            branch_id=req.branch_id,
        )

        created = self.repo.create_staff(new_staff)
        return UserResponse.model_validate(created)
