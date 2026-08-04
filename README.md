# Multi-Branch Café Management System Backend

A robust, multi-tenant backend system for a café enterprise platform built with **FastAPI**, **SQLAlchemy ORM**, **Pydantic**, and **JWT Authentication** implementing the **Controller-Service-Repository** architectural pattern.

---

## Features & Business Rules

1. **Multi-Tenancy & Role-Based Visibility Hierarchy**:
   - **Super Admin**: System-wide oversight to monitor all enterprise tenants, café owners, staff, customers, orders, and global telemetry.
   - **Café Owner**: Administrative control over their specific café enterprise (`tenant_id`), managing branch setups, hiring staff, defining master menu catalogs, and reviewing aggregate cross-branch analytics.
   - **Branch Staff / Manager**: Restricted strictly to their assigned physical branch (`branch_id`) for live order handling, POS in-house ordering, and payment processing.
   - **Customer**: Browses active branch menus and places online customer orders.
2. **Master Menu vs. Branch Location Pricing**:
   - Café Owners define a master catalog (`MasterMenuItem`) with base pricing.
   - Branches inherit catalog items or create location items, overriding prices (`price_override`) based on location/demand (e.g. Airport vs Downtown).
3. **Stock & Availability Toggling**:
   - Branches independently toggle item availability (`is_available`) without altering master menu definitions or other branches.
4. **Order Price Snapshot Integrity**:
   - Line items store `item_name_snapshot` and `unit_price_snapshot` at purchase time, insulating past financial records against future menu price updates.
5. **Order Lifecycle State Machine**:
   - Enforces valid status state transitions (`PENDING` → `IN_PREPARATION` → `COMPLETED` / `CANCELLED`).

---

## How to Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start Uvicorn development server
uvicorn app.main:app --reload
```

Interactive API documentation will be available at:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`
