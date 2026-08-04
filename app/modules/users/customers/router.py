from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import TokenData, require_authenticated_user
from app.modules.auth.schemas import UserResponse
from app.modules.users.customers.repository import CustomerRepository
from app.modules.users.customers.service import CustomerService

router = APIRouter(prefix="/users/customer", tags=["Customer Profile"])


def get_customer_service(db: Session = Depends(get_db)) -> CustomerService:
    repo = CustomerRepository(db)
    return CustomerService(repo)


@router.get("/me", response_model=UserResponse)
def get_my_customer_profile(
    current_user: TokenData = Depends(require_authenticated_user),
    service: CustomerService = Depends(get_customer_service),
):
    """
    Customer endpoint to view personal account profile.
    """
    return service.get_customer_profile(current_user.user_id)
