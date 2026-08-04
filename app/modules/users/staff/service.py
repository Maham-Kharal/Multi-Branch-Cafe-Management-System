from fastapi import HTTPException, status
from app.modules.auth.schemas import UserResponse
from app.modules.users.staff.repository import StaffRepository


class StaffService:
    def __init__(self, repo: StaffRepository):
        self.repo = repo

    def get_staff_profile(self, staff_id: str) -> UserResponse:
        user = self.repo.get_staff_by_id(staff_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff member not found",
            )
        return UserResponse.model_validate(user)
