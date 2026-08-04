from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.menu.master_menu.models import MasterMenuItem


class MasterMenuRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, item_id: str) -> Optional[MasterMenuItem]:
        return self.db.query(MasterMenuItem).filter(MasterMenuItem.id == item_id).first()

    def get_by_tenant(self, tenant_id: str) -> List[MasterMenuItem]:
        return self.db.query(MasterMenuItem).filter(MasterMenuItem.tenant_id == tenant_id).all()

    def create(self, item: MasterMenuItem) -> MasterMenuItem:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update(self, item: MasterMenuItem) -> MasterMenuItem:
        self.db.commit()
        self.db.refresh(item)
        return item
