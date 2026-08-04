from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums import UserRole
from app.core.database import get_db
from app.core.permissions import TokenData, require_cafe_owner
from app.modules.auth.schemas import UserResponse
from app.modules.users.branch_owner.repository import BranchOwnerUserRepository
from app.modules.users.branch_owner.schemas import CreateStaffRequest
from app.modules.users.branch_owner.service import BranchOwnerUserService

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
