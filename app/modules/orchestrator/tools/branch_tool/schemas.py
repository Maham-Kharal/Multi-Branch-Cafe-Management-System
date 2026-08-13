from typing import Optional
from pydantic import BaseModel


class BranchSearchInput(BaseModel):
    city: Optional[str] = None


class SelectBranchInput(BaseModel):
    branch_id: str
