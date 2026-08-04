from typing import List, Optional
from app.common.enums import UserRole
from app.modules.auth.schemas import UserResponse
from app.modules.users.super_admin.repository import SuperAdminRepository
from app.modules.users.super_admin.schemas import GlobalTelemetryResponse, TenantResponse


class SuperAdminService:
    def __init__(self, repo: SuperAdminRepository):
        self.repo = repo

    def get_tenants(self) -> List[TenantResponse]:
        tenants = self.repo.get_all_tenants()
        return [TenantResponse.model_validate(t) for t in tenants]

    def get_users(self, role: Optional[UserRole] = None) -> List[UserResponse]:
        users = self.repo.get_all_users(role=role)
        return [UserResponse.model_validate(u) for u in users]

    def get_telemetry(self) -> GlobalTelemetryResponse:
        stats = self.repo.get_global_telemetry()
        return GlobalTelemetryResponse(**stats)
