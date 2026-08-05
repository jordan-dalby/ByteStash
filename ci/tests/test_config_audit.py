import subprocess
import json
import requests


BASE = "https://localhost:8443"
HOST = {"Host": "bytestash.local"}


def docker_inspect(container: str):
    """Return the parsed `docker inspect` output for a container."""
    out = subprocess.run(
        ["docker", "inspect", container],
        capture_output=True, text=True, check=True,
    )
    return json.loads(out.stdout)[0]


def test_app_runs_as_non_root():
    """H-2: the app container must run as uid 1000, not root.

    The upstream Dockerfile sets no USER, so the image defaults to root.
    The compose sets user: 1000:1000. This asserts it actually took effect
    on the running container.
    """
    info = docker_inspect("bytestash-app")
    user = info["Config"]["User"]
    assert user == "1000:1000", f"expected app to run as 1000:1000, got '{user}'"


def test_app_has_no_published_ports():
    """H-1: the app must publish no host port. The WAF is the only ingress."""
    info = docker_inspect("bytestash-app")
    bindings = info["HostConfig"]["PortBindings"] or {}
    assert not bindings, f"app should publish no host ports, got {bindings}"


def test_app_read_only_rootfs():
    """H-3: the app container root filesystem must be read-only."""
    info = docker_inspect("bytestash-app")
    assert info["HostConfig"]["ReadonlyRootfs"] is True, "app rootfs should be read-only"


def test_app_drops_all_capabilities():
    """H-4: the app must drop ALL Linux capabilities."""
    info = docker_inspect("bytestash-app")
    cap_drop = info["HostConfig"]["CapDrop"] or []
    assert "ALL" in cap_drop, f"app should cap_drop ALL, got {cap_drop}"


def test_app_no_new_privileges():
    """H-4: no-new-privileges must be set, so the process can't gain
    privileges via setuid binaries."""
    info = docker_inspect("bytestash-app")
    sec_opt = info["HostConfig"]["SecurityOpt"] or []
    assert any("no-new-privileges" in s for s in sec_opt), \
        f"app should set no-new-privileges, got {sec_opt}"


def test_security_headers_present():
    """VP-6: the WAF must add the security headers the app itself never sets."""
    r = requests.get(f"{BASE}/api/auth/config", headers=HOST, verify=False, timeout=10)
    required = [
        "strict-transport-security",
        "x-content-type-options",
        "x-frame-options",
        "content-security-policy",
        "referrer-policy",
        "permissions-policy",
    ]
    missing = [h for h in required if h not in {k.lower() for k in r.headers}]
    assert not missing, f"missing security headers: {missing}"


def test_powered_by_hidden():
    """VP-7: X-Powered-By must be stripped."""
    r = requests.get(f"{BASE}/api/auth/config", headers=HOST, verify=False, timeout=10)
    assert "x-powered-by" not in {k.lower() for k in r.headers}, \
        "X-Powered-By should be hidden"


def test_http_redirects_to_https():
    """H-9: plain HTTP must 301 to HTTPS."""
    r = requests.get("http://localhost:8080/", headers=HOST,
                     allow_redirects=False, timeout=10)
    assert r.status_code == 301, f"expected 301 redirect, got {r.status_code}"
    assert r.headers.get("location", "").startswith("https://"), \
        f"redirect should go to https, got {r.headers.get('location')}"
