from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import TokenData, get_current_token_payload
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import TokenResponse, UserLoginRequest, UserRegisterRequest, UserResponse
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    repo = AuthRepository(db)
    return AuthService(repo)


@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    req: UserRegisterRequest,
    service: AuthService = Depends(get_auth_service)
):
    """
    Registers a new user (Customer, Staff, Café Owner with Tenant, or Super Admin).
    """
    return service.register_user(req)


@router.post("/login", response_model=TokenResponse)
def login(
    req: UserLoginRequest,
    service: AuthService = Depends(get_auth_service)
):
    """
    Authenticates a user and returns a signed JWT access token.
    """
    return service.login_user(req)


@router.get("/me", response_model=TokenData)
def get_me(current_user: TokenData = Depends(get_current_token_payload)):
    """
    Returns current authenticated user details extracted from JWT.
    """
    return current_user
