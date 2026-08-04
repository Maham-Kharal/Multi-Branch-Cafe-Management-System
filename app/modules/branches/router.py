from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import TokenData, require_authenticated_user, require_cafe_owner
from app.modules.branches.repository import BranchRepository
from app.modules.branches.schemas import BranchCreateRequest, BranchResponse, BranchUpdateRequest
from app.modules.branches.service import BranchService

router = APIRouter(prefix="/branches", tags=["Branch Setup"])


def get_branch_service(db: Session = Depends(get_db)) -> BranchService:
    repo = BranchRepository(db)
    return BranchService(repo)


@router.post("", response_model=BranchResponse, status_code=201)
def create_new_branch(
    req: BranchCreateRequest,
    user: TokenData = Depends(require_cafe_owner),
    service: BranchService = Depends(get_branch_service),
):
    """
    Café Owner endpoint to set up a new physical branch for their café enterprise.
    """
    return service.create_branch(user=user, req=req)


@router.get("", response_model=List[BranchResponse])
def list_branches(
    user: TokenData = Depends(require_authenticated_user),
    service: BranchService = Depends(get_branch_service),
):
    """
    Lists physical branches. Café Owners see their owned branches; Super Admins see all branches across platform.
    """
    return service.get_branches(user=user)


@router.get("/{branch_id}", response_model=BranchResponse)
def get_branch(
    branch_id: str,
    user: TokenData = Depends(require_authenticated_user),
    service: BranchService = Depends(get_branch_service),
):
    """
    Gets single branch details by ID with strict tenant boundary validation.
    """
    return service.get_branch_by_id(branch_id=branch_id, user=user)


@router.put("/{branch_id}", response_model=BranchResponse)
def update_branch(
    branch_id: str,
    req: BranchUpdateRequest,
    user: TokenData = Depends(require_cafe_owner),
    service: BranchService = Depends(get_branch_service),
):
    """
    Café Owner endpoint to update branch details. Validates that the branch belongs to the owner's enterprise.
    """
    return service.update_branch(branch_id=branch_id, user=user, req=req)


@router.delete("/{branch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_branch(
    branch_id: str,
    user: TokenData = Depends(require_cafe_owner),
    service: BranchService = Depends(get_branch_service),
):
    """
    Café Owner endpoint to remove a branch. Validates that the branch belongs to the owner's enterprise.
    """
    service.delete_branch(branch_id=branch_id, user=user)
    return None
