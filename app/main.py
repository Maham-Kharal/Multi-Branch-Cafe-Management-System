from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine

# Import all ORM models to ensure table registration with SQLAlchemy Metadata
import app.modules.users.super_admin.models
import app.modules.branches.models
import app.modules.menu.master_menu.models
import app.modules.menu.branch_menu.models
import app.modules.orders.customer_orders.models
import app.modules.payments.models
import app.modules.chat.chat_sessions.models
import app.modules.chat.chat_messages.models

# Include API Routers
from app.modules.auth.router import router as auth_router
from app.modules.users.super_admin.router import router as super_admin_router
from app.modules.users.branch_owner.router import router as cafe_owner_router
from app.modules.users.staff.router import router as staff_router
from app.modules.users.customers.router import router as customer_router
from app.modules.branches.router import router as branch_router
from app.modules.menu.master_menu.router import router as master_menu_router
from app.modules.menu.branch_menu.router import router as branch_menu_router
from app.modules.orders.customer_orders.router import router as customer_orders_router
from app.modules.orders.inhouse_orders.router import router as inhouse_orders_router
from app.modules.payments.router import router as payments_router
from app.modules.reports.router import router as reports_router

# Standalone Chat Module Routers
from app.modules.chat.chat_sessions.router import router as chat_sessions_router
from app.modules.chat.chat_messages.router import router as chat_messages_router

# AI Supervisor Orchestrator Router
from app.modules.orchestrator.router import router as orchestrator_router
from app.modules.orchestrator.tools.menu_tool.router import router as menu_tool_router
from app.modules.orchestrator.tools.order_tool.router import router as order_tool_router
from app.modules.orchestrator.tools.branch_tool.router import router as branch_tool_router
from app.modules.orchestrator.tools.payment_tool.router import router as payment_tool_router


# Auto-create all DB tables on application startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers under API V1 prefix
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(super_admin_router, prefix=api_prefix)
app.include_router(cafe_owner_router, prefix=api_prefix)
app.include_router(staff_router, prefix=api_prefix)
app.include_router(customer_router, prefix=api_prefix)
app.include_router(branch_router, prefix=api_prefix)
app.include_router(master_menu_router, prefix=api_prefix)
app.include_router(branch_menu_router, prefix=api_prefix)
app.include_router(customer_orders_router, prefix=api_prefix)
app.include_router(inhouse_orders_router, prefix=api_prefix)
app.include_router(payments_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)

# Standalone Chat & AI Orchestrator routers
app.include_router(chat_sessions_router, prefix=api_prefix)
app.include_router(chat_messages_router, prefix=api_prefix)
app.include_router(orchestrator_router, prefix=api_prefix)
app.include_router(menu_tool_router, prefix=api_prefix)
app.include_router(order_tool_router, prefix=api_prefix)
app.include_router(branch_tool_router, prefix=api_prefix)
app.include_router(payment_tool_router, prefix=api_prefix)


@app.get("/", tags=["Health"])
def root_status():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
    }

