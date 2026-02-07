# CI and Release Hygiene Baseline

This document defines the Phase 2 baseline for CI and release hygiene.

## Workflow

- File: `.github/workflows/ci.yml`
- Triggers:
  - `pull_request` to `main`
  - `push` to `main`

## Required CI Gates

- `bun run lint`
- `bun run test`
- `bun run build`
- `bun audit --json` with blocking threshold `high`/`critical`

All gates must pass before merge to keep `main` releasable.

## Pipeline Safety Controls

- Minimal token scope: workflow-level `contents: read`.
- Concurrency enabled with `cancel-in-progress: true` to avoid stale duplicate runs.
- Job timeouts:
  - quality: 20 minutes
  - dependency audit: 10 minutes

## Artifact Retention Policy

- Build artifact: `dist` uploaded from `quality` job.
  - retention: 14 days
- Dependency audit artifact: `audit-report.json`.
  - retention: 30 days

Rationale:
- Build artifacts support quick investigation of CI regressions.
- Audit reports are retained longer for security review history.

## Operational Notes

- Bun version is pinned in CI (`1.2.16`) for deterministic behavior.
- Moderate/low dependency vulnerabilities are recorded in artifacts and tracked in `bd`; high/critical fail CI.
- If release requirements change, update this policy and `.github/workflows/ci.yml` in the same PR.
