from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.common.enums import UserRole
from app.core.database import get_db
from app.core.permissions import TokenData, require_cafe_owner
from app.modules.auth.schemas import UserResponse
from app.modules.users.branch_owner.repository import BranchOwnerUserRepository
from app.modules.users.branch_owner.schemas import CreateStaffRequest, TenantUpdateRequest, UpdateStaffRequest
from app.modules.users.branch_owner.service import BranchOwnerUserService
from app.modules.users.super_admin.schemas import TenantResponse

router = APIRouter(prefix="/users/cafe-owner", tags=["Café Owner Management"])


def get_owner_service(db: Session = Depends(get_db)) -> BranchOwnerUserService:
    repo = BranchOwnerUserRepository(db)
    return BranchOwnerUserService(repo)


@router.get("/users", response_model=List[UserResponse])
def get_tenant_users(
    role: Optional[UserRole] = None,
    current_owner: TokenData = Depends(require_cafe_owner),
    service: BranchOwnerUserService = Depends(get_owner_service),
):
    """
    Café Owner endpoint to view staff and customers belonging to their enterprise café.
    """
    return service.get_my_tenant_users(tenant_id=current_owner.tenant_id, role=role)


@router.post("/staff", response_model=UserResponse, status_code=201)
def hire_branch_staff(
    req: CreateStaffRequest,
    current_owner: TokenData = Depends(require_cafe_owner),
    service: BranchOwnerUserService = Depends(get_owner_service),
):
    """
    Café Owner endpoint to create and assign branch staff to one of their café branches.
    """
    return service.create_branch_staff(tenant_id=current_owner.tenant_id, req=req)


@router.put("/staff/{staff_id}", response_model=UserResponse)
def update_branch_staff(
    staff_id: str,
    req: UpdateStaffRequest,
    current_owner: TokenData = Depends(require_cafe_owner),
    service: BranchOwnerUserService = Depends(get_owner_service),
):
    """
    Café Owner endpoint to re-assign branch staff to a different branch or update staff profile.
    """
    return service.update_branch_staff(tenant_id=current_owner.tenant_id, staff_id=staff_id, req=req)


@router.delete("/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_branch_staff(
    staff_id: str,
    current_owner: TokenData = Depends(require_cafe_owner),
    service: BranchOwnerUserService = Depends(get_owner_service),
):
    """
    Café Owner endpoint to remove staff access from their enterprise café.
    """
    service.delete_branch_staff(tenant_id=current_owner.tenant_id, staff_id=staff_id)
    return None


@router.put("/tenant", response_model=TenantResponse)
def update_tenant_enterprise(
    req: TenantUpdateRequest,
    current_owner: TokenData = Depends(require_cafe_owner),
    service: BranchOwnerUserService = Depends(get_owner_service),
):
    """
    Café Owner endpoint to update enterprise café name or description.
    """
    return service.update_tenant_enterprise(tenant_id=current_owner.tenant_id, req=req)
