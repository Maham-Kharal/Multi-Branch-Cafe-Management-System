from app.core.security import create_access_token
from app.modules.auth.schemas import TokenResponse
from app.modules.users.super_admin.models import User


def generate_user_token(user: User) -> TokenResponse:
    payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role.value,
        "tenant_id": user.tenant_id,
        "branch_id": user.branch_id,
    }
    access_token = create_access_token(data=payload)
    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        role=user.role,
        tenant_id=user.tenant_id,
        branch_id=user.branch_id,
    )
