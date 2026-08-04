from fastapi import HTTPException, status
from app.modules.auth.schemas import UserResponse
from app.modules.users.customers.repository import CustomerRepository


class CustomerService:
    def __init__(self, repo: CustomerRepository):
        self.repo = repo

    def get_customer_profile(self, customer_id: str) -> UserResponse:
        user = self.repo.get_customer_by_id(customer_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found",
            )
        return UserResponse.model_validate(user)
