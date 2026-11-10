import subprocess
import warnings
import urllib3
import pytest
import requests
import uuid

BASE = "https://localhost:8443"
HOST = {"Host": "bytestash.local", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def base_url():
    return BASE


@pytest.fixture(scope="session")
def creds():
    """A unique throwaway account per test run, so reruns don't collide
    on an already-registered username."""
    suffix = uuid.uuid4().hex[:8]
    return {"username": f"cituser_{suffix}", "password": "CiTestPassw0rd!"}


@pytest.fixture(scope="session")
def auth_token(creds):
    """Log in with the shared account and return a token. Assumes the account
    exists (created by the register test / a one-time register here)."""
    # one register attempt in case login runs first; ignore if already exists
    requests.post(f"{BASE}/api/auth/register", json=creds, headers=HOST,
                  verify=False, timeout=10)
    r = requests.post(f"{BASE}/api/auth/login", json=creds, headers=HOST,
                      verify=False, timeout=10)
    assert r.status_code == 200, f"auth setup failed: {r.status_code} {r.text[:200]}"
    return r.json()["token"]


def _register(username, password):
    """Register and return the token from the response directly.
    Register-only (no separate login) to stay under the 5/min auth rate limit."""
    r = requests.post(f"{BASE}/api/auth/register",
                      json={"username": username, "password": password},
                      headers=HOST, verify=False, timeout=10)
    assert r.status_code in (200, 201), \
        f"register failed for {username}: {r.status_code} {r.text[:200]}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def user_a():
    name = f"alice_{uuid.uuid4().hex[:8]}"
    return {"username": name, "token": _register(name, "AlicesPassw0rd!")}


@pytest.fixture(scope="session")
def user_b():
    name = f"bob_{uuid.uuid4().hex[:8]}"
    return {"username": name, "token": _register(name, "BobsPassw0rd!")}


@pytest.fixture(scope="session")
def admin_user():
    """Register an account and make it an admin with the admin CLI, the same way an
    operator would. Admin is read from the database on every request, so the token
    issued at registration works for admin routes straight away."""
    token = _register("ciadmin", "CiAdminPassw0rd!")
    subprocess.run(
        ["docker", "exec", "bytestash-app", "node", "src/scripts/admin.js", "grant", "ciadmin"],
        check=True, capture_output=True, text=True, timeout=60,
    )
    return {"username": "ciadmin", "token": token}
