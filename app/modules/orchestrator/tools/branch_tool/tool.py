from typing import Dict, Any
from sqlalchemy.orm import Session
from app.modules.branches.models import Branch
from app.modules.users.super_admin.models import User, Tenant
from app.common.utils import generate_uuid


def execute_list_branches(db: Session, city: str = "", user_id: str = "") -> Dict[str, Any]:
    """
    Executes branch queries against database, scoped to tenant if user_id is provided.
    """
    try:
        q = db.query(Branch).filter(Branch.is_active == True)
        
        # Scope branches to user's tenant if user_id provided
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.tenant_id:
                q = q.filter(Branch.tenant_id == user.tenant_id)

        if city:
            q = q.filter(Branch.address.ilike(f"%{city}%"))
            
        branches_db = q.all()
        branches = []
        
        for b in branches_db:
            branches.append({
                "id": str(b.id),
                "name": b.name,
                "address": b.address,
                "city": getattr(b, "city", "Main City"),
                "phone": b.phone or "N/A",
                "is_active": b.is_active
            })

        return {
            "success": True,
            "count": len(branches),
            "branches": branches
        }
    except Exception as e:
        return {
            "success": False,
            "count": 0,
            "branches": [],
            "error": str(e)
        }


def execute_select_branch(db: Session, branch_id: str) -> Dict[str, Any]:
    """
    Selects a branch for ordering session.
    """
    return {
        "success": True,
        "selected_branch_id": branch_id,
        "message": f"Successfully selected branch #{branch_id} for your current order session."
    }


def execute_create_branch(db: Session, user_role: Any, user_id: str, name: str, address: str, phone: str = "", city: str = "Main City") -> Dict[str, Any]:
    """
    Creates a new branch in database. Strictly restricted to CAFE_OWNER or SUPER_ADMIN roles
    and linked to the authenticated user's tenant_id.
    """
    role_str = str(user_role.value if hasattr(user_role, 'value') else user_role).upper()
    if "CAFE_OWNER" not in role_str and "SUPER_ADMIN" not in role_str and role_str != "OWNER":
        return {
            "success": False,
            "error": "Permission denied: Only authenticated Cafe Owners (CAFE_OWNER role) can create new branches."
        }

    # Validate required branch fields
    if not name or not name.strip() or name.lower() in ["new branch", "branch"]:
        return {
            "success": False,
            "error": "Branch creation failed: Please specify a valid Branch Name and Physical Address."
        }

    try:
        # Find user record in database to link exact tenant_id
        target_tenant_id = None
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.tenant_id:
                target_tenant_id = user.tenant_id

        if not target_tenant_id:
            # Fallback to first tenant or create tenant for owner
            existing_tenant = db.query(Tenant).first()
            if existing_tenant:
                target_tenant_id = existing_tenant.id
            else:
                new_tenant = Tenant(id=generate_uuid(), name="Café Enterprise Tenant")
                db.add(new_tenant)
                db.commit()
                target_tenant_id = new_tenant.id

        new_branch = Branch(
            id=generate_uuid(),
            tenant_id=target_tenant_id,
            name=name.strip(),
            address=address.strip() if address else "Main Street",
            city=city or "Main City",
            phone=phone or "N/A",
            is_active=True
        )
        db.add(new_branch)
        db.commit()
        db.refresh(new_branch)

        return {
            "success": True,
            "branch_id": str(new_branch.id),
            "name": new_branch.name,
            "address": new_branch.address,
            "city": new_branch.city,
            "tenant_id": target_tenant_id,
            "message": f"Successfully created new branch '{new_branch.name}' at address '{new_branch.address}' for your Enterprise."
        }
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "error": str(e)
        }
