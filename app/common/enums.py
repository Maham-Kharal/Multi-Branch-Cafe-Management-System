import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    CAFE_OWNER = "CAFE_OWNER"
    BRANCH_STAFF = "BRANCH_STAFF"
    CUSTOMER = "CUSTOMER"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PREPARATION = "IN_PREPARATION"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class OrderType(str, enum.Enum):
    CUSTOMER_ONLINE = "CUSTOMER_ONLINE"
    INHOUSE = "INHOUSE"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    CARD = "CARD"
    ONLINE = "ONLINE"
    UPI = "UPI"
