from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.menu.branch_menu.models import BranchMenuItem


class BranchMenuRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, item_id: str) -> Optional[BranchMenuItem]:
        return self.db.query(BranchMenuItem).filter(BranchMenuItem.id == item_id).first()

    def get_by_branch(self, branch_id: str) -> List[BranchMenuItem]:
        return self.db.query(BranchMenuItem).filter(BranchMenuItem.branch_id == branch_id).all()

    def create(self, item: BranchMenuItem) -> BranchMenuItem:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update(self, item: BranchMenuItem) -> BranchMenuItem:
        self.db.commit()
        self.db.refresh(item)
        return item
