from fastapi import HTTPException, status

from app.common.enums import UserRole
from app.core.security import get_password_hash, verify_password
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import TokenResponse, UserLoginRequest, UserRegisterRequest, UserResponse
from app.modules.auth.tokens import generate_user_token
from app.modules.users.super_admin.models import User


class AuthService:
    def __init__(self, repo: AuthRepository):
        self.repo = repo

    def register_user(self, req: UserRegisterRequest) -> UserResponse:
        existing_user = self.repo.get_user_by_email(req.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        # Role Passcode Security Verification
        if req.role == UserRole.SUPER_ADMIN and req.role_passcode != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid security passkey for Super Admin",
            )
        if req.role == UserRole.CAFE_OWNER and req.role_passcode != "CAFE":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid security passkey for cafe enterprise",
            )
        if req.role == UserRole.BRANCH_STAFF and req.role_passcode != "STAFF":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid security passkey for Branch Staff",
            )

        tenant_id = None
        # If registering a CAFE_OWNER, create a new Enterprise Tenant
        if req.role == UserRole.CAFE_OWNER:
            if not req.tenant_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="tenant_name is required when registering a CAFE_OWNER",
                )
            tenant = self.repo.create_tenant(name=req.tenant_name)
            tenant_id = tenant.id

        if req.role == UserRole.BRANCH_STAFF and req.branch_id and not tenant_id:
            from app.modules.branches.repository import BranchRepository
            branch = BranchRepository(self.repo.db).get_branch_by_id(req.branch_id)
            if branch:
                tenant_id = branch.tenant_id

        hashed_password = get_password_hash(req.password)
        new_user = User(
            email=req.email,
            hashed_password=hashed_password,
            full_name=req.full_name,
            role=req.role,
            tenant_id=tenant_id,
            branch_id=req.branch_id,
        )

        user = self.repo.create_user(new_user)
        return UserResponse.model_validate(user)

    def login_user(self, req: UserLoginRequest) -> TokenResponse:
        user = self.repo.get_user_by_email(req.email)
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated",
            )

        return generate_user_token(user)
