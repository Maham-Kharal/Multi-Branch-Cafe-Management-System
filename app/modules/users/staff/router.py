from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import TokenData, require_branch_staff
from app.modules.auth.schemas import UserResponse
from app.modules.users.staff.repository import StaffRepository
from app.modules.users.staff.service import StaffService

router = APIRouter(prefix="/users/staff", tags=["Branch Staff"])


def get_staff_service(db: Session = Depends(get_db)) -> StaffService:
    repo = StaffRepository(db)
    return StaffService(repo)


@router.get("/me", response_model=UserResponse)
def get_my_staff_profile(
    current_staff: TokenData = Depends(require_branch_staff),
    service: StaffService = Depends(get_staff_service),
):
    """
    Branch Staff endpoint to retrieve their assigned branch and staff profile.
    """
    return service.get_staff_profile(current_staff.user_id)
