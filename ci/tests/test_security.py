import requests
import jwt  # PyJWT
import time
import base64
import json

BASE = "https://localhost:8443"
HOST = {"Host": "bytestash.local", "Content-Type": "application/json"}


# ============================================================
# TB-B: User <-> Authentication boundary
# ============================================================

def test_tbb_spoofing_forged_default_secret_jwt():
    """STRIDE Spoofing / TB-B. A token forged with ByteStash's known-weak
    default secret ('your-secret') must be rejected, proving the deployment
    signs with a strong secret (VP-1, maps to Lab finding B-01).

    The attacker doesn't need the real secret; the risk is that the app might
    still accept the well-known default. A 200 here would mean full auth bypass."""
    forged = jwt.encode(
        {"id": 1, "username": "admin", "iat": int(time.time()),
         "exp": int(time.time()) + 3600},
        "your-secret",              # the known-weak upstream default
        algorithm="HS256",
    )
    auth = {**HOST, "bytestashauth": f"bearer {forged}"}
    r = requests.get(f"{BASE}/api/snippets", headers=auth, verify=False, timeout=10)
    assert r.status_code in (401, 403), \
        f"forged-default-secret token was NOT rejected (got {r.status_code}) — auth bypass!"


def test_tbb_spoofing_alg_none_token():
    """STRIDE Spoofing / TB-B. A token using 'alg:none' (no signature) must be
    rejected. The attack removes signing entirely, betting the server skips
    verification. Maps to VP-11 and modsec rule 10004."""
    # PyJWT requires explicit opt-in to even ENCODE an unsigned token
    forged = jwt.encode(
        {"id": 1, "username": "admin", "iat": int(time.time()),
         "exp": int(time.time()) + 3600},
        key="",
        algorithm="none",
    )
    auth = {**HOST, "bytestashauth": f"bearer {forged}"}
    r = requests.get(f"{BASE}/api/snippets", headers=auth, verify=False, timeout=10)
    assert r.status_code in (401, 403), \
        f"alg:none token was NOT rejected (got {r.status_code}) — signature bypass!"


def _tamper_jwt_claims(token, new_claims):
    """Take a real JWT, replace its payload with new_claims, keep the original
    signature. A correct server recomputes the signature over the new payload
    and rejects the mismatch."""
    header_b64, _payload_b64, sig_b64 = token.split(".")
    tampered_payload = base64.urlsafe_b64encode(
        json.dumps(new_claims).encode()
    ).rstrip(b"=").decode()
    return f"{header_b64}.{tampered_payload}.{sig_b64}"


def test_tbb_tampering_modified_claims_rejected(user_a):
    """STRIDE Tampering / TB-B. A validly-issued token whose claims are altered
    (here, the user id/username changed to impersonate another account) must be
    rejected, because altering the payload invalidates the HMAC signature."""
    real_token = user_a["token"]

    # decode the real payload just to build a plausible tampered one
    _h, payload_b64, _s = real_token.split(".")
    padded = payload_b64 + "=" * (-len(payload_b64) % 4)
    original = json.loads(base64.urlsafe_b64decode(padded))

    # impersonate a different account by changing id + username
    tampered_claims = {**original, "id": 99999, "username": "someone_else"}
    tampered = _tamper_jwt_claims(real_token, tampered_claims)

    auth = {**HOST, "bytestashauth": f"bearer {tampered}"}
    r = requests.get(f"{BASE}/api/snippets", headers=auth, verify=False, timeout=10)
    assert r.status_code in (401, 403), \
        f"tampered-claims token was NOT rejected (got {r.status_code}) — signature not verified!"


def test_tbb_info_disclosure_idor_private_snippet(user_a, user_b):
    """STRIDE Information Disclosure / TB-B. User B must NOT be able to read
    user A's private snippet by its ID. Tests authorization (ownership check),
    not just authentication. This is OWASP A01 Broken Access Control / IDOR."""
    a_auth = {**HOST, "bytestashauth": f"bearer {user_a['token']}"}
    b_auth = {**HOST, "bytestashauth": f"bearer {user_b['token']}"}

    # User A creates a PRIVATE snippet
    private_snippet = {
        "title": "alice-private-secret",
        "description": "should never be visible to bob",
        "is_public": 0,
        "categories": ["private"],
        "fragments": [{
            "file_name": "secret.txt",
            "code": "ALICE_CONFIDENTIAL_DATA_42",
            "language": "plaintext",
            "position": 0,
        }],
    }
    r = requests.post(f"{BASE}/api/snippets", json=private_snippet,
                      headers=a_auth, verify=False, timeout=10)
    assert r.status_code in (200, 201), f"setup: A couldn't create snippet: {r.status_code}"
    snippet_id = r.json()["id"]

    # User B attempts to read it by ID
    r = requests.get(f"{BASE}/api/snippets/{snippet_id}",
                     headers=b_auth, verify=False, timeout=10)

    # B must be denied. A leak is 200 with A's data.
    assert r.status_code in (403, 404), \
        f"IDOR: user B read user A's private snippet (got {r.status_code}) — broken access control!"

    # belt-and-suspenders: even if status is unexpectedly 200, the secret must not be present
    if r.status_code == 200:
        assert "ALICE_CONFIDENTIAL_DATA_42" not in r.text, \
            "IDOR: user A's confidential snippet content leaked to user B!"


def test_tbc_elevation_nonadmin_denied_admin_route(user_a, admin_user):
    """STRIDE Elevation of Privilege / TB-C. A regular authenticated user must
    be denied access to an admin-only endpoint (403). Verifies the app checks
    authorization (admin role), not merely authentication."""
    admin_auth = {**HOST, "bytestashauth": f"bearer {admin_user['token']}"}
    user_auth = {**HOST, "bytestashauth": f"bearer {user_a['token']}"}

    ADMIN_ROUTE = "/api/admin/users"

    # sanity: the admin CAN reach it (proves the route exists and admin works)
    r_admin = requests.get(f"{BASE}{ADMIN_ROUTE}", headers=admin_auth,
                           verify=False, timeout=10)
    assert r_admin.status_code == 200, \
        f"setup: admin couldn't reach {ADMIN_ROUTE} (got {r_admin.status_code})"

    # the actual test: a regular user must be denied
    r_user = requests.get(f"{BASE}{ADMIN_ROUTE}", headers=user_auth,
                          verify=False, timeout=10)
    assert r_user.status_code in (401, 403), \
        f"privilege escalation: non-admin reached {ADMIN_ROUTE} (got {r_user.status_code})!"


def test_tbc_spoofing_forged_admin_token_rejected(user_a):
    """STRIDE Spoofing / TB-C. A token forged to claim an admin username must
    not grant admin access. Admin is decided by the username claim, so this
    tests that the claim can't be spoofed without the real signing secret.
    Combines the weak-secret forge (VP-1) with the username-based admin model."""
    # forge a token claiming to be the admin, signed with the known-weak default
    forged_admin = jwt.encode(
        {"id": 1, "username": "ciadmin", "iat": int(time.time()),
         "exp": int(time.time()) + 3600},
        "your-secret",
        algorithm="HS256",
    )
    auth = {**HOST, "bytestashauth": f"bearer {forged_admin}"}

    r = requests.get(f"{BASE}/api/admin/users", headers=auth, verify=False, timeout=10)
    assert r.status_code in (401, 403), \
        f"admin spoofing: forged admin token was accepted (got {r.status_code}) — privilege bypass!"


def test_tbd_tampering_login_sqli_does_not_authenticate():
    """STRIDE Tampering / TB-D. A classic SQL-injection payload in the login
    username must not authenticate. ByteStash uses prepared statements, so the
    payload is treated as a literal username and login fails cleanly rather
    than injecting. Verifies the app<->DB query boundary."""
    sqli_attempts = [
        {"username": "admin' OR '1'='1", "password": "x"},
        {"username": "admin'--", "password": "x"},
        {"username": "' OR 1=1--", "password": "x"},
    ]
    for creds in sqli_attempts:
        r = requests.post(f"{BASE}/api/auth/login", json=creds,
                          headers=HOST, verify=False, timeout=10)
        # must NOT succeed. 401 (bad creds) is the correct outcome.
        # A 200 with a token would mean the injection worked.
        assert r.status_code != 200, \
            f"SQLi login succeeded with {creds['username']!r} — injection!"
        assert "token" not in r.text, \
            f"SQLi login returned a token for {creds['username']!r} — injection!"
