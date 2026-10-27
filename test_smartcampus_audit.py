"""
SmartCampus End-to-End Verification Test Suite
Tests security hardening, API routes, student claim tracking, image uploads, AI services, and frontend integrity.
"""
import sys
import io
import json
from pathlib import Path

# Ensure backend directory is in sys.path
PROJECT_ROOT = Path(__file__).parent.resolve()
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app
from database import init_db

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("STARTING SMARTCAMPUS AUTOMATED AUDIT VERIFICATION")
    print("=" * 60)
    passed = 0
    failed = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, failed
        if condition:
            print(f"[PASS] {name}")
            passed += 1
        else:
            print(f"[FAIL] {name} - Details: {details}")
            failed += 1

    # --- 1. Root & Health Check ---
    res = client.get("/")
    assert_test("API Root Status Online", res.status_code == 200 and res.json().get("status") == "online", res.text)

    # --- 2. Security Test: Admin Bypass Token Blocked ---
    fake_admin_headers = {"Authorization": "Bearer demo-token-admin-maliciousbypass"}
    res = client.get("/admin/stats", headers=fake_admin_headers)
    assert_test(
        "SEC-01: Admin Bypass Token Rejected",
        res.status_code == 403,
        f"Expected 403, got {res.status_code}: {res.text}"
    )

    # --- 3. Security Test: Wrong Password Rejected for Existing Student ---
    res = client.post("/auth/login", json={
        "email": "priya.sharma@mitsgwl.ac.in",
        "password": "wrongpassword123"
    })
    assert_test(
        "SEC-02a: Wrong Password Rejected for Student",
        res.status_code == 401,
        f"Expected 401, got {res.status_code}: {res.text}"
    )

    # --- 4. Security Test: Correct Password Accepted for Student ---
    res = client.post("/auth/login", json={
        "email": "priya.sharma@mitsgwl.ac.in",
        "password": "mits2026pass"
    })
    priya_token = res.json().get("token")
    assert_test(
        "SEC-02b: Correct Password Accepted for Student",
        res.status_code == 200 and priya_token and priya_token.startswith("sc-"),
        f"Got: {res.text}"
    )
    priya_headers = {"Authorization": f"Bearer {priya_token}"}

    # Verify student cannot access admin stats
    res = client.get("/admin/stats", headers=priya_headers)
    assert_test(
        "SEC-01b: Student Forbidden from Admin Stats",
        res.status_code == 403,
        f"Expected 403, got {res.status_code}"
    )

    # --- 5. Admin Login & Authorization ---
    res = client.post("/auth/login", json={
        "email": "admin@mitsgwl.ac.in",
        "password": "admin123"
    })
    admin_token = res.json().get("token")
    assert_test(
        "Admin Login Successful with Credentials",
        res.status_code == 200 and admin_token and res.json().get("user", {}).get("role") == "admin",
        res.text
    )
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.get("/admin/stats", headers=admin_headers)
    assert_test(
        "Admin Stats Accessible with Valid Admin Token",
        res.status_code == 200 and "total_reports" in res.json(),
        res.text
    )

    # --- 6. BUG-02: Image Upload Relative Path Verification ---
    dummy_image = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb")
    upload_data = {
        "type": "found",
        "name": "Audit Test Blue Water Bottle",
        "category": "accessories",
        "location": "Central Library Reading Hall",
        "description": "Stainless steel blue water bottle found on table 4."
    }
    upload_files = {
        "image": ("test_bottle.jpg", dummy_image, "image/jpeg")
    }
    res = client.post("/reports/with-image", data=upload_data, files=upload_files, headers=priya_headers)
    report_created = res.json()
    image_url = report_created.get("image_url", "")
    assert_test(
        "BUG-02: Image Upload URL Relative and Not Localhost",
        res.status_code == 200 and image_url.startswith("/uploads/") and "http://localhost:8000" not in image_url,
        f"Image URL received: {image_url}"
    )
    test_report_id = report_created.get("id")

    # --- 7. FEAT-01: Ownership Claim Submission & /claims/mine Verification ---
    claim_payload = {
        "report_id": test_report_id,
        "lost_where_when": "Left at table 4 around 11:30 AM",
        "proof": "Distinctive MITS robotics club sticker on the base",
        "contact": "priya.sharma@mitsgwl.ac.in"
    }
    res = client.post("/claims", json=claim_payload, headers=priya_headers)
    assert_test(
        "Claim Submission Endpoint",
        res.status_code == 200 and res.json().get("status") == "submitted",
        res.text
    )
    claim_id = res.json().get("claim_id")

    # Fetch /claims/mine as Priya
    res = client.get("/claims/mine", headers=priya_headers)
    claims_list = res.json()
    found_claim = next((c for c in claims_list if c["id"] == claim_id), None)
    assert_test(
        "FEAT-01a: Student /claims/mine Retrieval",
        res.status_code == 200 and found_claim is not None and found_claim.get("status") == "pending",
        f"Claims count: {len(claims_list)}, found_claim: {found_claim}"
    )

    # --- 8. Admin Moderation: Approve Claim ---
    res = client.patch(f"/admin/claims/{claim_id}?status=approved", headers=admin_headers)
    assert_test(
        "Admin Approve Claim",
        res.status_code == 200 and res.json().get("status") == "approved",
        res.text
    )

    # Verify claim status updated to approved in student /claims/mine
    res = client.get("/claims/mine", headers=priya_headers)
    claims_list = res.json()
    updated_claim = next((c for c in claims_list if c["id"] == claim_id), None)
    assert_test(
        "FEAT-01b: Student Sees Approved Claim Status",
        res.status_code == 200 and updated_claim and updated_claim.get("status") == "approved",
        f"Updated claim: {updated_claim}"
    )

    # --- 9. Notifications ---
    res = client.get("/notifications", headers=priya_headers)
    assert_test(
        "Student Notifications Feed",
        res.status_code == 200 and isinstance(res.json(), list),
        f"Notifications received: {len(res.json())}"
    )

    # --- 10. AI Services ---
    res = client.get("/ai/status")
    assert_test(
        "AI Status Operational",
        res.status_code == 200 and res.json().get("status") == "online",
        res.text
    )

    res = client.post("/ai/enhance", json={
        "title": "black fastrack watch",
        "description": "found in library reading hall",
        "category": "accessories",
        "location": "Library"
    })
    enhanced = res.json()
    assert_test(
        "AI Auto-Enhance Report",
        res.status_code == 200 and len(enhanced.get("key_tags", enhanced.get("tags", []))) > 0,
        res.text
    )

    res = client.post("/ai/chat", json={"query": "Did anyone find a calculator in seminar hall?"})
    ai_reply = res.json()
    assert_test(
        "AI Conversational Assistant Reply",
        res.status_code == 200 and len(ai_reply.get("reply", "")) > 10,
        res.text
    )

    # --- 11. Frontend File Integrity & Mobile Navigation ---
    html_files = [
        "index.html",
        "pages/browse.html",
        "pages/report.html",
        "pages/my-reports.html",
        "pages/notifications.html",
        "pages/admin.html",
        "pages/login.html",
        "pages/register.html",
        "pages/how-it-works.html"
    ]
    all_html_exist = True
    all_mobile_nav = True
    for h in html_files:
        p = PROJECT_ROOT / h
        if not p.exists():
            all_html_exist = False
        else:
            text = p.read_text(encoding="utf-8")
            if h.startswith("pages/") and h not in ["pages/how-it-works.html"]:
                if 'id="menuToggle"' not in text or 'id="mobileNav"' not in text:
                    all_mobile_nav = False

    assert_test("Frontend: All 9 Core HTML Pages Present", all_html_exist)
    assert_test("UI-01: Mobile Navigation Drawer Present on All Sub-pages", all_mobile_nav)

    # Check dead file removal
    dead_header = PROJECT_ROOT / "pages" / "_header.html"
    assert_test("CLN-01: Dead 0-byte Header Removed", not dead_header.exists())

    print("=" * 60)
    print(f"VERIFICATION COMPLETE: {passed} PASSED, {failed} FAILED")
    print("=" * 60)
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
