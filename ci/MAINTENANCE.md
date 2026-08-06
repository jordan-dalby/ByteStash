# Security Pipeline Maintenance Guide

This guide explains how to extend and maintain the security pipeline defined in
`.github/workflows/security.yml` and the CI assets in `ci/`. It is written for a
maintainer who did not build the pipeline and needs to change it safely.

## Overview

The pipeline has two phases.

**Static phase** (parallel jobs, no running application): Semgrep (SAST), Trivy
filesystem scan (SCA), Trivy image scan (container vulnerabilities), and Gitleaks
(secret detection). Each runs the tool's own container directly.

**Dynamic phase** (one job, `dynamic-testing`): deploys the hardened stack from
`ci/docker-compose.ci.yaml`, then runs three pytest suites against the running
application (config audit, functionality, security), then tears the stack down.

A final `notify-issue` job optionally files a GitHub Issue when any job fails. It
is off by default.

A design note that governs everything below: the deploy and the tests live in a
**single job** on purpose. GitHub Actions runs each job on a fresh, isolated
runner with no shared filesystem or containers, so a test in a separate job would
start on a machine where the deployed stack does not exist. Anything that needs the
running application must be a **step** in `dynamic-testing`, not a separate job.

## 1. How to add new test cases

All application tests are pytest files under `ci/tests/`:

- `test_config_audit.py` asserts hardening controls took effect on the running
  containers (non-root, no published ports, read-only rootfs, headers, and so on).
- `test_functionality.py` asserts the application still works through the hardened
  proxy (register, login, snippet round-trip).
- `test_security.py` asserts trust-boundary controls hold, organised by STRIDE
  category and trust boundary.

Shared fixtures live in `ci/tests/conftest.py`: `base_url`, `creds`, `auth_token`,
and the multi-user fixtures `user_a`, `user_b`, `admin_user`.

To add a test:

1. Decide which file it belongs in. Config facts go in the audit file; "does the
   app work" goes in functionality; "is a threat refused" goes in security.
2. Write it as a normal pytest function. Reuse the fixtures rather than
   registering users inline (see the rate-limit warning below).
3. For security tests, name the STRIDE category and trust boundary in the
   docstring, and map it to the threat it defends. This keeps the suite
   traceable to the threat model.
4. Run it locally before pushing (see "Running locally" below).

**Two constraints that will bite you if ignored:**

- **The login rate limit.** The application rate-limits `/api/auth/login` and
  `/api/auth/register` (5 requests/minute per IP). Every test runs from the same
  runner IP, so the whole suite shares one budget. Authenticate as few times as
  possible: register once per user via a session-scoped fixture and reuse the
  token. If you add tests that hit the auth endpoints and start seeing HTTP 429
  in test setup, that is the limit, not a bug. The CI nginx config widens the
  `burst` allowance (not the rate) to fit the suite's setup traffic; if you add
  many new auth-touching tests you may need to widen it further in
  `ci/nginx/default.conf.template`.

- **Trust a test only after you have seen it fail.** Before relying on a new
  assertion, deliberately break the thing it checks and confirm the test goes red.
  A test that passes when the control is present but also passes when the control
  is removed is worse than no test. Every audit and security test in this suite was
  validated this way.

## 2. How to update tools and configurations

**Scanner tools.** Each scanner runs as its own container, pinned by image name in
`.github/workflows/security.yml` (for example `aquasec/trivy:latest`,
`semgrep/semgrep`, `zricethezav/gitleaks:latest`). To update a tool, change its
image tag. Prefer running the tool's own container directly over a marketplace
action: several marketplace actions for these tools are deprecated or assume the
full GitHub environment and fail under local testing. The direct-container pattern
is also portable to other CI systems.

When you change a scanner's flags, keep the two Trivy jobs consistent: both the
filesystem scan and the image scan use `--exit-code 1` so that findings fail the
job. If you change one, change the other, or the phase behaves inconsistently.

**Hardening configuration.** The deployed stack is defined by:

- `ci/docker-compose.ci.yaml` - the two services and their hardening controls.
- `ci/nginx/default.conf.template` and `ci/nginx/bytestash_proxy.inc` - TLS,
  security headers, host allowlist, rate limits, proxy behaviour.
- `ci/modsec/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf` - the WAF rule tuning
  and custom request filters.

The rule for changing any of these: **a control stays only if a test verifies it
or the application needs it to run.** If you add a hardening control, add a config
audit assertion for it. If you remove one, remove or update the assertion, and
confirm the audit still passes for the right reason. The config audit is what turns
"we configured hardening" into "the pipeline proves hardening is in effect", so it
must track the config.

**Ephemeral material.** The TLS certificate and JWT secret are generated at runtime
in the deploy job, not committed. `ci/certs/` and `ci/secrets/` are gitignored; do
not commit anything into them, and note that the secret scanner will (correctly)
flag a committed private key.

**Volume ownership.** The hardened containers run as non-root, but Docker creates
named volumes owned by root. The deploy job therefore creates the volumes, chowns
them to the container's user (1000 for the app, 101 for the WAF), and only then
starts the stack. If you add a service that runs non-root and writes to a volume,
add a matching chown step, or it will fail to start with a permission error.

## 3. How to interpret and act on reports

**Overall run status is expected to be red.** The scanners fail on findings, and
the target is a third-party codebase whose issues cannot be fixed in this
repository. A red run is normal; the value is in *which* jobs are red and what they
report, not in a green checkmark. Read the individual job results, not the top-line
status.

Interpreting each job:

- **Semgrep / Trivy / Gitleaks red:** the scanner found something. Open the job log
  and read the findings. Many are denial-of-service issues in transitive
  dependencies, and some are in packages that are not reachable in this
  application. Triage each finding against whether the affected code path is
  actually used before treating it as urgent. A clean Gitleaks run means no leaked
  *credentials*; it does not check for weak default values, which are a different
  class handled by static rules and config.
- **Config audit red:** this is a real regression. A hardening control that should
  be in effect is not. Unlike scanner findings, an audit failure means something in
  the deployment configuration changed for the worse. Fix the config or the test,
  whichever is wrong.
- **Functionality red:** the hardening broke the application. Most often this is the
  WAF or a CRS rule blocking legitimate traffic. Check the WAF audit log and the
  failing request.
- **Security test red:** a trust-boundary control failed. Read the test's docstring
  for the STRIDE category and the threat, then investigate whether the control
  regressed or a genuine vulnerability was introduced.

**Notifications.** The `notify-issue` job is opt-in. Set the repository variable
`NOTIFY_ISSUE` to `true` (Settings, then Secrets and variables, then Actions, then
the Variables tab) to enable it. When enabled and any job fails, it maintains a
single open GitHub Issue labelled `security-pipeline`: it creates the issue if none
is open, and comments on it on later failing runs. Leaving the variable unset keeps
notifications off.

## 4. How to maintain compatibility with future application versions

The pipeline runs the published upstream image unmodified and hardens it only
through configuration, so most application updates require no pipeline change. The
places to check when the application updates:

- **The image tag.** `ci/docker-compose.ci.yaml` pulls the published image. A new
  application version is picked up automatically if you track a rolling tag, or by
  updating the tag if you pin one. Pinning by digest is more reproducible.

- **New or changed endpoints.** The tests reference specific paths (for example the
  admin route and the snippet API). If the application changes an endpoint's path,
  request shape, or status codes, the affected tests will fail on a mismatch rather
  than on a real security problem. Update the test to match the new contract.
  Status codes are a common source of this: creation endpoints may return 200 or
  201, and the tests accept both.

- **The authentication header and token shape.** The tests send the token in the
  header the application expects. If a version changes the auth header name or the
  token format, update `conftest.py` and the security tests accordingly.

- **New hardening-relevant behaviour.** If a version adds a feature that introduces
  a new trust boundary or a new sensitive endpoint, add a config audit assertion
  and, where appropriate, a STRIDE-mapped security test for it, following the
  existing structure.

- **WAF rule tuning.** The application legitimately stores code, so the CRS
  injection rules are disabled on the snippet and MCP paths. If a version adds a new
  endpoint that carries code-like content, it may need the same exclusion, or the
  functionality tests will fail with the WAF blocking legitimate input. Conversely,
  if an endpoint is removed, its exclusion can be removed.

When in doubt, run the full dynamic phase locally against the new version before
pushing. A failing functionality test after an application update usually means the
application contract changed, not that the hardening is wrong.

## Running locally

The static jobs and the dynamic deploy can be run locally with
[`act`](https://github.com/nektos/act), which executes the workflow in Docker.

The dynamic job runs `docker compose` inside the job, so under `act` it needs the
host Docker socket's group added:

```
act push --container-options "--group-add $(stat -c %g /var/run/docker.sock)"
```

On GitHub's hosted runners Docker is native and no such flag is needed. The
`notify-issue` job cannot be tested under `act`, because it needs the real GitHub
API and token; verify it on GitHub by enabling `NOTIFY_ISSUE` and triggering a run.
