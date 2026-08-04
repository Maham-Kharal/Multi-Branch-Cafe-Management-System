from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.common.enums import UserRole
from app.core.database import get_db
from app.core.security import decode_access_token

security = HTTPBearer()


class TokenData(BaseModel):
    user_id: str
    email: str
    role: UserRole
    tenant_id: Optional[str] = None
    branch_id: Optional[str] = None


def get_current_token_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    """Extracts and parses JWT token payload from Authorization header."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    email: str = payload.get("email")
    role_str: str = payload.get("role")
    
    if not user_id or not role_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed authentication token payload",
        )
    
    try:
        role = UserRole(role_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid user role in token: {role_str}",
        )

    return TokenData(
        user_id=user_id,
        email=email,
        role=role,
        tenant_id=payload.get("tenant_id"),
        branch_id=payload.get("branch_id"),
    )


class PermissionChecker:
    """
    Role-Based Access Control (RBAC) Dependency class.
    Validates if the requesting user's role is within allowed roles.
    """
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(
        self, token_data: TokenData = Depends(get_current_token_payload)
    ) -> TokenData:
        if token_data.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in self.allowed_roles]}",
            )
        return token_data


# Reusable FastAPI dependency instances
require_super_admin = PermissionChecker([UserRole.SUPER_ADMIN])
require_cafe_owner = PermissionChecker([UserRole.SUPER_ADMIN, UserRole.CAFE_OWNER])
require_branch_staff = PermissionChecker([
    UserRole.SUPER_ADMIN, UserRole.CAFE_OWNER, UserRole.BRANCH_STAFF
])
require_authenticated_user = PermissionChecker([
    UserRole.SUPER_ADMIN, UserRole.CAFE_OWNER, UserRole.BRANCH_STAFF, UserRole.CUSTOMER
])
