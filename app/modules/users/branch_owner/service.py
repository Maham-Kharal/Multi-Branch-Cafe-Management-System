from typing import List, Optional
from fastapi import HTTPException, status

from app.common.enums import UserRole
from app.core.security import get_password_hash
from app.modules.auth.schemas import UserResponse
from app.modules.users.branch_owner.repository import BranchOwnerUserRepository
from app.modules.users.branch_owner.schemas import CreateStaffRequest, TenantUpdateRequest, UpdateStaffRequest
from app.modules.users.super_admin.models import User
from app.modules.users.super_admin.schemas import TenantResponse


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

    def update_branch_staff(self, tenant_id: str, staff_id: str, req: UpdateStaffRequest) -> UserResponse:
        staff = self.repo.get_user_by_id(staff_id)
        if not staff or staff.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff member not found in your café enterprise",
            )

        if req.full_name is not None:
            staff.full_name = req.full_name
        if req.branch_id is not None:
            staff.branch_id = req.branch_id
        if req.is_active is not None:
            staff.is_active = req.is_active

        updated = self.repo.update_user(staff)
        return UserResponse.model_validate(updated)

    def delete_branch_staff(self, tenant_id: str, staff_id: str) -> None:
        staff = self.repo.get_user_by_id(staff_id)
        if not staff or staff.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff member not found in your café enterprise",
            )
        self.repo.delete_user(staff)

    def update_tenant_enterprise(self, tenant_id: str, req: TenantUpdateRequest) -> TenantResponse:
        tenant = self.repo.get_tenant_by_id(tenant_id)
        if not tenant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant enterprise not found")

        if req.name is not None:
            tenant.name = req.name
        if req.description is not None:
            tenant.description = req.description
        if req.is_active is not None:
            tenant.is_active = req.is_active

        updated = self.repo.update_tenant(tenant)
        return TenantResponse.model_validate(updated)
