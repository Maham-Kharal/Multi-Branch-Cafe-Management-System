from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.branches.models import Branch


class BranchRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_branch_by_id(self, branch_id: str) -> Optional[Branch]:
        return self.db.query(Branch).filter(Branch.id == branch_id).first()

    def get_branches_by_tenant(self, tenant_id: str) -> List[Branch]:
        return self.db.query(Branch).filter(Branch.tenant_id == tenant_id).all()

    def get_all_branches(self) -> List[Branch]:
        return self.db.query(Branch).all()

    def create_branch(self, branch: Branch) -> Branch:
        self.db.add(branch)
        self.db.commit()
        self.db.refresh(branch)
        return branch

    def update_branch(self, branch: Branch) -> Branch:
        self.db.commit()
        self.db.refresh(branch)
        return branch

    def delete_branch(self, branch: Branch) -> None:
        self.db.delete(branch)
        self.db.commit()
