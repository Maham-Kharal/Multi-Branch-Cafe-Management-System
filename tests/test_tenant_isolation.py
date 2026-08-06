import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_tenant_isolation_branch_access():
    uid_a = uuid.uuid4().hex[:8]
    uid_b = uuid.uuid4().hex[:8]

    # 1. Register Cafe Owner A (Tenant A)
    reg_a = client.post("/api/v1/auth/register", json={
        "email": f"owner_a_{uid_a}@cafe.com",
        "password": "Password123!",
        "full_name": "Test Owner A",
        "role": "CAFE_OWNER",
        "tenant_name": f"Tenant A {uid_a}"
    })
    assert reg_a.status_code == 201, reg_a.text
    
    # Login Owner A
    login_a = client.post("/api/v1/auth/login", json={
        "email": f"owner_a_{uid_a}@cafe.com",
        "password": "Password123!"
    })
    assert login_a.status_code == 200, login_a.text
    token_a = login_a.json()["access_token"]

    # 2. Create Branch for Tenant A
    create_branch_a = client.post(
        "/api/v1/branches",
        json={
            "name": f"Branch A {uid_a}",
            "address": "123 Street A",
            "city": "Lahore",
            "phone": "03001111111"
        },
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert create_branch_a.status_code == 201, create_branch_a.text
    branch_a_id = create_branch_a.json()["id"]

    # 3. Register Cafe Owner B (Tenant B)
    reg_b = client.post("/api/v1/auth/register", json={
        "email": f"owner_b_{uid_b}@cafe.com",
        "password": "Password123!",
        "full_name": "Test Owner B",
        "role": "CAFE_OWNER",
        "tenant_name": f"Tenant B {uid_b}"
    })
    assert reg_b.status_code == 201, reg_b.text
    
    # Login Owner B
    login_b = client.post("/api/v1/auth/login", json={
        "email": f"owner_b_{uid_b}@cafe.com",
        "password": "Password123!"
    })
    assert login_b.status_code == 200, login_b.text
    token_b = login_b.json()["access_token"]

    # 4. Tenant Isolation Verification: Owner B tries to access Branch A
    unauthorized_resp = client.get(
        f"/api/v1/branches/{branch_a_id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    # MUST return 403 Forbidden
    assert unauthorized_resp.status_code == 403, unauthorized_resp.text
    assert unauthorized_resp.json()["detail"] == "Access denied to this branch"

    # 5. Owner A accesses their own Branch A
    authorized_resp = client.get(
        f"/api/v1/branches/{branch_a_id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    # MUST return 200 OK
    assert authorized_resp.status_code == 200, authorized_resp.text
    assert authorized_resp.json()["id"] == branch_a_id
