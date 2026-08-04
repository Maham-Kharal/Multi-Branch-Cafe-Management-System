# Re-export unified User and Tenant models for Branch Owner module context
from app.modules.users.super_admin.models import Tenant, User

__all__ = ["User", "Tenant"]
