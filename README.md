# NanoStyle

Internal MVP for the NanoBanana Prompt Refinery workflow.

## Requirements

- Bun `1.2.x`
- Node.js LTS (for tooling compatibility)

## Setup

```bash
bun install
cp .env.example .env
```

See `docs/env-contract.md` for validation rules and CI/runtime requirements.
See `docs/secrets-provisioning.md` for local setup and GitHub Actions secret provisioning.

## Development

```bash
bun run dev
```

## Internal Sharing (Cloudflare Tunnel)

```bash
bun run tunnel:quick
# or
CLOUDFLARE_TUNNEL_TOKEN=... bun run tunnel:token
```

Runbook: `docs/cloudflare-tunnel-runbook.md`

Optional access gate for shared links:

```bash
ACCESS_GATE_PASSWORD=... bun run dev
```

## Quality Gates

```bash
bun run lint
bun run test
bun run build
```

CI enforces these checks plus dependency audit. See `docs/ci-release-hygiene.md`.

Release operations runbook: `docs/release-launch-runbook.md`.

Deployment and share pipeline: `docs/deployment-share-pipeline.md`.

Latest launch baseline snapshot: `docs/launch-baseline-2026-02-07.md`.

## Contracts

- API contract: `docs/api-contract.md`
- Provider adapter contracts: `docs/provider-adapter-contracts.md`
- Telemetry contract: `docs/telemetry-contract.md`

## Backend Endpoints

- `GET /api/templates`
- `POST /api/session/start`
- `POST /api/session/answer`
- `POST /api/synthesize`
- `POST /api/generate`

## Project Structure

- `src/api` server endpoints and route handlers
- `src/schemas` runtime validation and contracts
- `src/services/openai` OpenAI adapter boundary
- `src/services/nanobanana` NanoBanana adapter boundary
- `src/session` session and state interfaces
- `src/ui` reusable UI-level components/helpers

## Issue Tracking

This repository uses `bd` (beads) for all work tracking.
