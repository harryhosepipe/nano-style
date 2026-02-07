# Requirements Traceability Matrix

## Purpose
Map PRD and spec requirements to implementation task IDs from `todo.md` so no requirement is unowned.

## MVP Scope
In scope (MVP):
- Template-first flow with one template (`general-cinematic`), one initial input, and fixed 3-question refinement.
- Server-side prompt synthesis and NanoBanana generation.
- Minimal stepper UX and internal sharing via Cloudflare Tunnel.
- Session-based state (no accounts) and baseline observability.

Out of scope (MVP):
- Auth/accounts, payments/credits, quota/rate-limit products.
- Seed/negative prompts and advanced generation controls.
- Prompt visibility/editing for end users.
- Persistent gallery/history and multi-template management UI.
- Advanced policy/content guardrail systems beyond basic provider safety handling.

## PRD Functional Requirements Coverage
| Requirement | Summary | Mapped Task IDs |
| --- | --- | --- |
| FR-PR-01 | Show pre-configured templates | `P3-T1`, `P4-T2`, `P5-T1` |
| FR-PR-02 | Accept one initial constraint | `P3-T1`, `P4-T2`, `P5-T1` |
| FR-PR-03 | OpenAI-generated next question | `P3-T3`, `P4-T3`, `P6-T1` |
| FR-PR-04 | One-question-at-a-time stepper | `P1-T1`, `P5-T2`, `P6-T1` |
| FR-PR-05 | Cap refinement at 3 questions | `P1-T1.1`, `P4-T3`, `P6-T3` |
| FR-PR-06 | Server-side final prompt synthesis | `P3-T3`, `P4-T3`, `P4-T4` |
| FR-PR-07 | Never display synthesized prompt | `P1-T2.1`, `P5-T3.2`, `P6-T3.2` |
| FR-PR-08 | Per-session state only | `P3-T1`, `P4-T1`, `P6-T2` |
| FR-NB-01 | Send final prompt to NanoBanana | `P3-T3.2`, `P4-T4`, `P6-T3` |
| FR-NB-02 | Handle async/polling/webhook variants | `P3-T3.2`, `P4-T4`, `P6-T3.1` |
| FR-NB-03 | Render image result | `P5-T3`, `P6-T1`, `P6-T3` |
| FR-NB-04 | Graceful actionable failure handling | `P1-T2.2`, `P4-T5.2`, `P6-T1.2` |
| FR-UX-01 | Stepper refinement UX | `P1-T1`, `P5-T2` |
| FR-UX-02 | Minimal required screens | `P5-T1`, `P5-T2`, `P5-T3` |
| FR-UX-03 | Progress indicator | `P5-T2`, `P5-T4.2` |
| FR-UX-04 | No prompt display | `P1-T2.1`, `P5-T3.2` |
| FR-UX-05 | Start over/switch template available | `P1-T1.2`, `P6-T2.2` |
| FR-OBS-01 | Provider request logging with redaction | `P1-T3.2`, `P4-T5`, `P7-T3.1` |
| FR-OBS-02 | Latency/error/completion metrics | `P1-T3`, `P4-T5.1`, `P7-T4` |

## PRD Non-Functional and Architecture Coverage
| Requirement | Summary | Mapped Task IDs |
| --- | --- | --- |
| NFR-Performance | <1s page load target, light client JS, 60-90s image target | `P5-T4`, `P7-T4.1` |
| NFR-Reliability | Retries/backoff and idempotent behavior where possible | `P4-T4.1`, `P6-T3`, `P7-T2` |
| NFR-Security | Keys server-side only, proxy endpoints | `P1-T2.1`, `P4-T2`, `P7-T3.1` |
| NFR-Privacy | Clarify outbound user data to providers | `P1-T2.1`, `P2-T1`, `P7-T3` |
| Deployment | Local dev + Cloudflare Tunnel share | `P2-T3`, `P8-T2.1` |
| Frontend architecture | Astro pages + minimal islands | `P0-T2`, `P5-T4` |
| Backend endpoints | `/api/templates`, `/api/session/start`, `/api/session/answer`, `/api/generate` | `P3-T2`, `P4-T2`, `P4-T4` |
| Session model | Signed-cookie keyed session state, upgrade path | `P3-T1`, `P4-T1`, `P9-T2.1` |
| OpenAI contract | Template + fixed questions + server-only output | `P1-T1.1`, `P3-T3.1`, `P4-T3` |
| Error handling | Stable error behavior and user-safe messages | `P1-T2.2`, `P4-T5.2`, `P6-T1.2` |
| Analytics | Funnel + time-to-image instrumentation | `P1-T3.1`, `P4-T5.1`, `P8-T3.2` |
| Risks/mitigations | Quality/latency/cost controls | `P4-T3.2`, `P4-T4.1`, `P7-T1` |

## Spec Constraints Coverage
| Spec Constraint | Summary | Mapped Task IDs |
| --- | --- | --- |
| §2 Runtime & Language | Node LTS, TS strict, package manager policy | `P0-T2.1`, `P0-T3.1` |
| §3 Frontend | Astro SSR, minimal JS, accessible stepper | `P0-T2`, `P5-T2`, `P5-T4` |
| §4 Backend | Astro endpoints and request/response validation | `P3-T1`, `P3-T2`, `P4-T2` |
| §5 OpenAI Integration | Official SDK, API adapter choice, strict output contract | `P3-T3.1`, `P4-T3`, `P9-T2.2` |
| §6 NanoBanana Integration | Client contract, timeouts/retries, image handling | `P3-T3.2`, `P4-T4`, `P6-T3.1` |
| §7 Session State | In-memory MVP + upgrade-ready interface | `P4-T1`, `P6-T2`, `P9-T2.1` |
| §8 Secrets & Config | `.env` contract and key protection | `P2-T1`, `P7-T3.1` |
| §9 Observability | Structured logs, request IDs, metrics | `P1-T3`, `P3-T4`, `P4-T5` |
| §10 Local Sharing | Cloudflare Tunnel + optional gate | `P2-T3`, `P2-T3.2`, `P8-T2.1` |
| §11 Dev Tooling | Lint/format/typecheck/test baseline | `P0-T3`, `P2-T2`, `P7-T1` |
| §12 Out of Scope | Keep non-MVP work deferred | `P0-T1.1`, `P9-T2`, `Backlog` |
| §13 Open Questions | Resolve API/deployment/policy unknowns | `P0-T1.2`, `P3-T3`, `P8-T2.2` |

## Coverage Check
- Every PRD FR item (`FR-PR-*`, `FR-NB-*`, `FR-UX-*`, `FR-OBS-*`) is mapped to at least one task ID.
- PRD NFR and architecture constraints are mapped.
- Spec constraints (§2-§13) are mapped to planned work.
- Open decisions are tracked in `docs/adr/ADR-000-project-baseline.md`.
