from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.common.enums import UserRole


class CreateStaffRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    branch_id: str
