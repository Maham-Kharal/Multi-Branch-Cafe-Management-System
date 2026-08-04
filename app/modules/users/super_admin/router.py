from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums import UserRole
from app.core.database import get_db
from app.core.permissions import TokenData, require_super_admin
from app.modules.auth.schemas import UserResponse
from app.modules.users.super_admin.repository import SuperAdminRepository
from app.modules.users.super_admin.schemas import GlobalTelemetryResponse, TenantResponse
from app.modules.users.super_admin.service import SuperAdminService

router = APIRouter(prefix="/users/super-admin", tags=["Super Admin"])


def get_super_admin_service(db: Session = Depends(get_db)) -> SuperAdminService:
    repo = SuperAdminRepository(db)
    return SuperAdminService(repo)


@router.get("/tenants", response_model=List[TenantResponse])
def list_all_tenants(
    service: SuperAdminService = Depends(get_super_admin_service),
    admin_token: TokenData = Depends(require_super_admin),
):
    """
    Super Admin endpoint to monitor all onboarding Café Enterprise Tenants across the platform.
    """
    return service.get_tenants()


@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    role: Optional[UserRole] = None,
    service: SuperAdminService = Depends(get_super_admin_service),
    admin_token: TokenData = Depends(require_super_admin),
):
    """
    Super Admin endpoint to view every Café Owner, Branch Staff, and Customer in the system.
    """
    return service.get_users(role=role)


@router.get("/telemetry", response_model=GlobalTelemetryResponse)
def get_platform_telemetry(
    service: SuperAdminService = Depends(get_super_admin_service),
    admin_token: TokenData = Depends(require_super_admin),
):
    """
    Super Admin endpoint to monitor global system telemetry, aggregate revenue, and system metrics.
    """
    return service.get_telemetry()
