# ADR-000: Project Baseline

- Status: Accepted (baseline), with pending sub-decisions
- Date: 2026-02-07
- Owner: Engineering
- Related tasks: `P0-T1`, `P0-T1.1`, `P0-T1.2`

## Context
The MVP must mirror the custom GPT workflow with low complexity, strong server-side boundaries, and clear migration paths. This ADR records baseline architectural decisions and unresolved items that require follow-up.

## Baseline Decisions
1. Runtime and language
- Node.js LTS.
- TypeScript strict mode.
- `bun` is the default package manager for deterministic installs and fast local workflows.

2. Web architecture
- Astro with SSR enabled.
- Minimal client JS, using islands only where needed for the stepper UX.

3. Backend and API contract
- Astro server endpoints are the integration boundary:
  - `GET /api/templates`
  - `POST /api/session/start`
  - `POST /api/session/answer`
  - `POST /api/generate`
- Runtime validation via `zod`.

4. Session and state
- MVP uses in-memory session storage keyed by signed cookie-backed session ID.
- Session interface must remain storage-agnostic for later KV/DB migration.

5. LLM/provider isolation
- OpenAI and NanoBanana integrations are adapter-based services behind internal interfaces.
- Final synthesized prompt is server-only and never sent to clients.

6. Reliability and observability
- Structured JSON logging with request IDs, latency, status, and error code fields.
- Retry/timeout policy applied for provider calls where safe.

7. Sharing and operations
- Local-first MVP with Cloudflare Tunnel for internal/partner testing.

## MVP Scope Guardrails
In scope:
- One template (`general-cinematic`), one initial input, fixed 3-question refinement, generate image, iterate actions.

Out of scope:
- Auth/accounts, payments/credits.
- Prompt visibility/editing for users.
- Seeds/negative prompts/advanced controls.
- Persistent gallery/history/multi-template management UI.

## Open Decisions (Tracked)
| Decision ID | Question | Impact | Owner | Due Phase | Status |
| --- | --- | --- | --- | --- | --- |
| D-001 | Exact NanoBanana API contract (sync vs async, payload shape, URL vs base64/blob) | Blocks stable `/api/generate` implementation and frontend generation-state behavior | Engineering | Phase 3 | Open |
| D-002 | Whether refinement can end early before Q3 | Affects stepper state machine and endpoint behavior | Product + Engineering | Phase 1 | Open |
| D-003 | OpenAI startup path (Responses-first vs Assistants-first) | Affects adapter implementation and migration workload | Engineering | Phase 3 | Open |
| D-004 | Whether tunnel sharing needs password gate in MVP | Affects partner-access hardening | Product + Engineering | Phase 2 | Open |
| D-005 | Post-MVP hosting target (Cloudflare/Vercel/etc.) | Affects deployment pipeline design in later phase | Engineering | Phase 8 | Open |
| D-006 | Image hosting approach for MVP (provider URL vs internal proxy/store) | Affects caching and future gallery path | Engineering | Phase 6 | Open |

## Consequences
- Enables immediate implementation with clear boundaries and low rework risk.
- Keeps current MVP speed while preserving future migration paths.
- Requires explicit closure of open decisions by their due phases.
