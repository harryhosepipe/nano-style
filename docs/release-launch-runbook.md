# Release and Launch Runbook

This runbook defines the Phase 8 release checklist and launch operations for the NanoStyle internal MVP.

## Scope

- Release readiness decision (go/no-go)
- Launch execution checklist
- Rollback procedure
- Incident response flow

## Owners

- Release lead: drives go/no-go call and launch timeline
- Operator: executes deploy/share actions and validates health checks
- Scribe: records timeline, decisions, incidents, and telemetry snapshot links

## Go/No-Go Criteria

All criteria below must be green before launch starts.

- Quality gates pass on `main`:
  - `bun run lint`
  - `bun run test`
  - `bun run build`
- CI dependency audit has no high/critical findings.
- Required runtime secrets are provisioned and validated against `docs/env-contract.md`.
- Partner access path verified:
  - Cloudflare Tunnel path validated (see `docs/cloudflare-tunnel-runbook.md`)
  - Optional access gate credentials validated if enabled
- Baseline API checks pass:
  - `GET /api/templates` returns expected templates
  - Session flow (`/api/session/start`, `/api/session/answer`, `/api/generate`) completes successfully
- Telemetry logging is enabled and writable per `docs/telemetry-contract.md`.

No-go triggers:
- Any failing quality gate
- Missing/invalid secrets
- Partner cannot access shared endpoint
- Blocking API contract mismatch or repeated 5xx errors during smoke checks

## Pre-Launch Checklist

1. Confirm the exact commit SHA and tag (if used) for launch.
2. Confirm CI status for that SHA is fully green.
3. Start a launch log document (timestamped) with release lead, operator, and scribe names.
4. Run smoke checks in local/staging-like environment.
5. Confirm Cloudflare tunnel mode selected:
   - Ephemeral for one-off review
   - Named tunnel for recurring partner usage
6. Confirm incident communication channel is active and responders are reachable.

## Launch Procedure

1. Announce launch start and planned window in the incident/ops channel.
2. Deploy or start the approved build from the launch SHA.
3. Bring up share path (`bun run tunnel:quick` or `bun run tunnel:token`).
4. Validate partner access to the shared URL.
5. Execute one full scripted acceptance flow:
   - Open app
   - Complete session start/answer flow
   - Generate prompt output
6. Capture immediate telemetry snapshot:
   - request success/error rates
   - representative request IDs
   - any provider fallback behavior
7. If all checks pass, mark launch as successful in the launch log.

## Rollback Procedure

Rollback immediately if launch smoke checks fail repeatedly, partner access breaks, or error rate materially degrades.

1. Announce rollback start in incident/ops channel.
2. Disable shared path (stop tunnel) or route traffic back to last known good instance.
3. Revert to last known good commit SHA/build.
4. Re-run baseline smoke checks on reverted version.
5. Confirm partner access and core API/session flow recovery.
6. Announce rollback complete with root-cause hypothesis and next mitigation step.

## Incident Response

Severity guide:
- Sev-1: app unavailable, data corruption risk, or complete generation outage
- Sev-2: major degradation affecting partner testing
- Sev-3: minor defects with workaround

Response flow:
1. Detect: operator/smoke tests/partner report identify issue.
2. Triage: assign incident commander and severity within 10 minutes.
3. Contain: choose rollback, temporary mitigation, or degraded-mode operation.
4. Recover: verify service health and partner path after fix.
5. Review: create follow-up `bd` issues for root cause and prevention.

Minimum incident log fields:
- start timestamp
- detected by
- impact summary
- mitigation decision
- recovery timestamp
- follow-up issue IDs

## Launch Artifacts to Archive

- Launch log document link
- Commit SHA/tag launched
- Cloudflare tunnel mode and URL used
- Telemetry snapshot reference
- Acceptance scenario evidence (timestamps + result summary)
- Incident timeline (if any)

## Completion Criteria

Launch is complete when:
- Go/no-go criteria were satisfied and recorded
- Launch procedure completed successfully
- Telemetry snapshot archived
- Any incidents are either resolved or tracked as open `bd` issues
