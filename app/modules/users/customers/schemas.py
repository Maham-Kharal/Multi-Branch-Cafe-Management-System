from pydantic import BaseModel
from app.modules.auth.schemas import UserResponse


class CustomerProfileResponse(UserResponse):
    pass
