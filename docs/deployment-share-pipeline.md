# Deployment and Internal Share Pipeline

This document defines the Phase 8 deployment/share pipeline for the internal MVP launch.

## Current Deployment Model (MVP)

NanoStyle currently uses a local-first runtime with Cloudflare Tunnel for partner/internal access.

Pipeline:
1. Run app locally: `bun run dev`
2. Expose app:
   - Ephemeral: `bun run tunnel:quick`
   - Stable named tunnel: `bun run tunnel:token`
3. Validate shared URL access with partner and run acceptance scenario.

Related references:
- `docs/cloudflare-tunnel-runbook.md`
- `docs/release-launch-runbook.md`
- `docs/env-contract.md`

## Dry-Run Validation Record

Validation timestamp (UTC): `2026-02-07T13:28:46Z`

Commands executed:
- `curl -fsS http://127.0.0.1:4321`
- `LOCAL_PORT=4321 bun run tunnel:quick` (under timeout)
- `curl -I https://javascript-behavioral-tough-princess.trycloudflare.com`

Observed result:
- Quick tunnel creation succeeded and connector registered.
- Generated URL responded with `HTTP/2 530` from Cloudflare edge in this environment.
- Local app health check remained successful.

Interpretation:
- Tunnel tooling and run command path are operational.
- End-to-end public URL validation from this environment is not reliable for quick tunnel mode.
- Launch validation should use named tunnel mode when possible and include partner-side confirmation.

## Recommended Share Validation Path

For launch-day validation:
1. Prefer named tunnel mode (`bun run tunnel:token`) using provisioned `CLOUDFLARE_TUNNEL_TOKEN`.
2. Confirm app is healthy on local origin first (`http://127.0.0.1:4321`).
3. Confirm tunnel endpoint from at least one external client (partner or separate network).
4. Run one scripted acceptance scenario on the external URL.
5. Archive URL, timestamps, and pass/fail result in launch artifacts.

## Staging and Production Path

Current status:
- Staging: Not provisioned (local + tunnel acts as pre-launch validation lane).
- Production: Not provisioned (internal MVP launch is local-first).

Documented path once hosting target is selected:
1. Staging
- Auto-deploy from integration branch to managed host.
- Environment-scoped secrets for staging.
- Smoke tests and acceptance scenario against staging URL.

2. Production
- Promote from tested commit SHA on `main`.
- Re-run smoke checks post-deploy.
- Activate tunnel/share only if internal review requires it.

Exit criteria to adopt staged/prod hosting:
- Hosting platform decision is finalized (see ADR open decision D-005).
- Secret management and environment segregation are configured.
- Release runbook is updated with host-specific rollback steps.
