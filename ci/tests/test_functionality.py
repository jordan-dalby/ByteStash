import requests


BASE = "https://localhost:8443"
HOST = {"Host": "bytestash.local", "Content-Type": "application/json"}


def test_register(creds):
    """A user can register through the hardened proxy."""
    r = requests.post(f"{BASE}/api/auth/register", json=creds, headers=HOST,
                      verify=False, timeout=10)
    # 200 = created; 409/400 = already exists (fine on rerun)
    assert r.status_code in (200, 400, 409), \
        f"register failed unexpectedly: {r.status_code} {r.text[:200]}"


def test_login(creds):
    """A registered user can log in. Reuses the account from registration."""
    r = requests.post(f"{BASE}/api/auth/login", json=creds, headers=HOST,
                      verify=False, timeout=10)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    assert "token" in r.json()


def test_snippet_roundtrip(auth_token):
    """Create a snippet with injection-shaped content and read it back,
    proving the CRS exclusion on /api/snippets allows legitimate code."""
    auth = {**HOST, "bytestashauth": f"bearer {auth_token}"}

    payload = {
        "title": "ci-test-snippet",
        "description": "roundtrip test with injection-shaped content",
        "is_public": 0,
        "categories": ["ci-test"],
        "fragments": [
            {
                "file_name": "exploit.sql",
                "code": "SELECT * FROM users WHERE name='' OR 1=1; -- <script>alert(1)</script>",
                "language": "sql",
                "position": 0,
            }
        ],
    }

    r = requests.post(f"{BASE}/api/snippets", json=payload, headers=auth,
                      verify=False, timeout=10)
    assert r.status_code in (200, 201), f"snippet create failed: {r.status_code} {r.text[:300]}"
    snippet_id = r.json().get("id")
    assert snippet_id is not None

    r = requests.get(f"{BASE}/api/snippets/{snippet_id}", headers=auth,
                     verify=False, timeout=10)
    assert r.status_code == 200, f"snippet read failed: {r.status_code} {r.text[:300]}"
    assert "OR 1=1" in r.json()["fragments"][0]["code"]
