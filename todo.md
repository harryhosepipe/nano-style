# NanoBanana Prompt Refinery — Implementation Plan

## Quick Summary
- Internal MVP web app that mirrors the existing custom GPT workflow: template selection, one initial input, fixed 3-question refinement, hidden prompt synthesis, and NanoBanana image output.
- Architecture is Astro SSR + TypeScript strict + Astro server endpoints, with OpenAI and NanoBanana integrations fully server-side.
- Delivery target is internal testing via local development and Cloudflare Tunnel, with clean upgrade paths for persistence/auth later.
- Out-of-scope for MVP: auth/accounts/payments/credits, seeds/negative prompts/advanced controls, prompt visibility/editing, persistent gallery/history, multi-template management UI, advanced content guardrails.

## Extracted From Docs (Grounding Snapshot)
- Key user journeys (from PRD):
  - Select `general-cinematic` template, enter one initial constraint, answer three refinement questions one at a time, generate image, then iterate via regenerate/change answers/start over.
  - Generation flow is refinement-first and server-orchestrated, with final prompt never shown to the user.
- Key entities/data objects (from spec):
  - `Template`: `{ id, name, description, instructions }` (MVP includes `general-cinematic`).
  - `SessionState`: `{ templateId, initialInput, answers[3], createdAt, lastUpdatedAt, lastImageRef? }` keyed by signed session cookie.
  - API payloads: `/api/templates`, `/api/session/start`, `/api/session/answer`, `/api/generate`.
  - Server-only synthesis output: `final_nanobanana_prompt: string` with length cap.
  - Error envelope: `{ error, code }`.
- Integrations (from PRD/spec):
  - OpenAI official Node SDK (Assistants or Responses, with migration-safe adapter).
  - NanoBanana API via HTTP client (`fetch`/`undici`) with timeout/retry handling.
  - Cloudflare Tunnel for partner access during internal MVP testing.
- Non-functional requirements (from PRD/spec):
  - Performance: fast page loads (<1s on fast connection) and average time-to-image ~60–90s.
  - Reliability: retries/backoff where appropriate, stable schema parsing, fixed 3-turn cap.
  - Security/privacy: API keys never exposed to client; payload validation; no stack traces to client.
  - Accessibility: keyboard navigation, focus management, form validation in stepper UX.
  - Observability: structured JSON logs, latency/error/completion metrics, funnel tracking.
- Constraints (from spec):
  - Node LTS runtime, TypeScript strict mode, Astro SSR, minimal client JS (islands only where needed).
  - Runtime validation with Zod and shared contract types.
  - Session state remains in-memory for MVP (upgrade path to KV/DB later).
  - Keep OpenAI/NanoBanana keys server-side; never expose final synthesized prompt.

## Assumptions (Must Validate)
1. `pnpm` will be the package manager for reproducibility and speed unless the team explicitly chooses `npm`. [SPEC: §2 Runtime & Language]
2. Responses API will be default for new implementation, with an adapter boundary that can still support Assistants if needed. [PRD: §8 Reality check + MVP approach] [SPEC: §5 OpenAI Integration]
3. The fixed question set in PRD §8 is the canonical MVP wording/order, superseding earlier shorthand phrasing. [PRD: §4 Core User Journey] [PRD: §8 Fixed questions]
4. NanoBanana generation may be sync or async; backend contract will abstract both behind one `generate` flow. [PRD: §5.2 FR-NB-02] [SPEC: §6 NanoBanana Integration]
5. Local/internal MVP does not require persistent DB in first release; in-memory session loss on restart is acceptable for internal testing. [PRD: §1 Summary] [PRD: §7 State] [SPEC: §7 Session State]
6. Analytics event `manual prompt edits frequency` is deferred/non-applicable in MVP because prompt editing is a non-goal. [PRD: §2 Non-Goals] [PRD: §10 Analytics]

## Open Questions
### Blocking
- What is the exact NanoBanana API contract (request fields, sync vs async, polling/webhook model, response URL vs base64/blob)?  
  Affects `/api/generate` request/response schema, storage/streaming path, and frontend generation status handling. [PRD: §5.2 FR-NB-02] [PRD: §13 Open Questions] [SPEC: §6 NanoBanana Integration]
- Is refinement allowed to end before 3 questions, or is 3 always enforced unless user abandons?  
  Affects session state machine, `/api/session/answer` behavior, and progress UI logic. [PRD: §5.1 FR-PR-05] [PRD: §13 Open Questions]
- Which OpenAI path is approved for MVP start (Responses-first vs Assistants-first with migration)?  
  Affects adapter implementation details, test fixtures, and migration backlog timing. [PRD: §8 Reality check] [SPEC: §5 OpenAI Integration]

### Non-blocking
- Should Cloudflare Tunnel access include a simple password gate for partner sharing?  
  Affects launch hardening and partner access friction. [SPEC: §10 Local Sharing]
- What hosting target is preferred post-local MVP (Cloudflare Pages/Workers, Vercel, etc.)?  
  Affects Phase 8 deployment automation but not local MVP completion. [SPEC: §13 Open Questions]
- Should generated images remain NanoBanana-hosted URLs for MVP or be proxied/stored internally?  
  Affects caching and future gallery readiness, but can be deferred for internal MVP. [PRD: §13 Open Questions] [SPEC: §6 Image Handling]

## Risks & Mitigations
- Assistants deprecation risk (shutdown August 26, 2026) may create rework.  
  Mitigation: implement provider adapter and keep conversation model contract-neutral from day one. [PRD: §8 Reality check] [SPEC: §5 OpenAI Integration]
- NanoBanana API ambiguity can block integration late.  
  Mitigation: contract spike in Phase 3 with mocked variants (sync + async + URL/base64) before backend feature coding. [PRD: §13 Open Questions] [SPEC: §6 NanoBanana Integration]
- In-memory session state may be lost on restart, causing incomplete flows.  
  Mitigation: explicit MVP acceptance + clear UX restart behavior + upgrade-ready state interface. [PRD: §7 State] [SPEC: §7 Session State]
- Latency may exceed 60–90s target under real calls.  
  Mitigation: strict 3-question cap, output length cap, timeout/retry policy, and instrumentation of per-step latency. [PRD: §4 MVP Success Criteria] [PRD: §11 Risks] [SPEC: §5/§6/§9]
- Prompt quality inconsistency can reduce trust in outputs.  
  Mitigation: strict JSON contract, validation, parse retry once, and deterministic defaults for sparse answers. [PRD: §11 Risks] [SPEC: §5 Output Contract]

## Hierarchical TODO List

> Conventions:
> - Each task includes: **What**, **Why**, **Depends on**, **Deliverable**, **DoD**
> - Optional role tags: `[FE] [BE] [DevOps] [QA] [Design]` (safe for solo dev, ignore tags)
> - Add traceability tags: `[PRD: <heading/req>] [SPEC: <heading>]`

## Phase 0 — Foundations & Repo Setup
**Goal:** Establish a reproducible Astro + TypeScript strict repository baseline, with standards and traceability artifacts aligned to PRD/spec constraints.  
**Phase Gate / Exit Criteria:**
- Repo scaffolding exists and runs locally with `pnpm` scripts for dev/build/lint/test.
- TypeScript strict mode, linting, and formatting are configured and passing.
- Initial architecture/decision docs map requirements from PRD/spec.

- [ ] [P0-T1] Establish requirement traceability matrix and architecture decision log [BE] [PRD: §1 Summary, §5 Functional Requirements] [SPEC: §1 Objective, §4 Backend]
  - **What:** Create a doc that maps each PRD functional/non-functional requirement and each spec constraint to implementation work items.
  - **Why:** Prevent requirement gaps and enforce spec-constrained implementation.
  - **Depends on:** None
  - **Deliverable:** `docs/requirements-traceability.md` and `docs/adr/ADR-000-project-baseline.md`.
  - **DoD:** Every PRD FR/NFR and spec constraint has at least one mapped task ID.
  - [ ] [P0-T1.1] Capture MVP scope and explicit non-goals in docs [BE] [PRD: §2 Goals and Non-Goals] [SPEC: §12 Out of Scope]
    - **What:** Document what is in-scope and out-of-scope for MVP to avoid accidental feature creep.
    - **Why:** Keeps engineering focus and reduces rework.
    - **Depends on:** [P0-T1]
    - **Deliverable:** Scope section in `docs/requirements-traceability.md`.
    - **DoD:** Scope list matches PRD/spec non-goal language.
  - [ ] [P0-T1.2] Record unresolved architecture decisions as tracked items [BE] [PRD: §13 Open Questions] [SPEC: §13 Open Questions]
    - **What:** Convert open questions into tracked decision entries with owner and deadline.
    - **Why:** Surfaces blockers early and keeps sequencing realistic.
    - **Depends on:** [P0-T1]
    - **Deliverable:** Decision log entries in `docs/adr/ADR-000-project-baseline.md`.
    - **DoD:** All blocking questions listed with impact and due phase.

- [ ] [P0-T2] Scaffold Astro SSR app with TypeScript strict and canonical project structure [FE] [BE] [PRD: §7 System Architecture] [SPEC: §2 Runtime & Language, §3 Frontend]
  - **What:** Initialize Astro project with SSR enabled, strict TypeScript, and source directories for API, integrations, schemas, and UI.
  - **Why:** Creates the implementation base for both server endpoints and minimal frontend.
  - **Depends on:** [P0-T1]
  - **Deliverable:** Working Astro app structure with strict TS compile.
  - **DoD:** `pnpm run dev` and `pnpm run build` succeed in a clean clone.
  - [ ] [P0-T2.1] Configure runtime/tool versions and scripts [DevOps] [PRD: §7 Deployment] [SPEC: §2 Runtime & Language, §11 Dev Tooling]
    - **What:** Set Node LTS, package manager policy, and package scripts (`dev`, `build`, `lint`, `test`).
    - **Why:** Ensures consistent local/CI execution.
    - **Depends on:** [P0-T2]
    - **Deliverable:** `package.json`, `.nvmrc` (or equivalent), lockfile.
    - **DoD:** All required scripts execute and are documented.
  - [ ] [P0-T2.2] Create baseline folder layout for contracts and adapters [BE] [PRD: §7 Backend Endpoints] [SPEC: §4 Backend, §5 OpenAI Integration, §6 NanoBanana Integration]
    - **What:** Add folders for `api`, `schemas`, `services/openai`, `services/nanobanana`, `session`, and `ui`.
    - **Why:** Enforces contract-first structure and adapter isolation.
    - **Depends on:** [P0-T2]
    - **Deliverable:** Consistent directory structure with placeholder modules.
    - **DoD:** Architecture structure matches documented boundaries.

- [ ] [P0-T3] Configure quality tooling and contribution guardrails [DevOps] [QA] [PRD: §6 Non-Functional Requirements] [SPEC: §11 Dev Tooling]
  - **What:** Set up ESLint, Prettier, optional pre-commit hooks, and contribution templates.
  - **Why:** Prevents quality drift and enforces deterministic coding standards.
  - **Depends on:** [P0-T2]
  - **Deliverable:** Tooling config files and repository contribution docs.
  - **DoD:** Lint/format checks run locally and can be executed in CI.
  - [ ] [P0-T3.1] Add lint/format/typecheck configuration [DevOps] [PRD: §6 Reliability] [SPEC: §11 Dev Tooling]
    - **What:** Configure strict lint and formatter rules compatible with TypeScript strict mode.
    - **Why:** Catch defects early and keep codebase maintainable.
    - **Depends on:** [P0-T3]
    - **Deliverable:** `eslint` and `prettier` configs, `tsconfig` strict settings.
    - **DoD:** `pnpm run lint` and typecheck pass on starter code.
  - [ ] [P0-T3.2] Add PR template, commit conventions, and README bootstrap [DevOps] [PRD: §1 Summary] [SPEC: §1 Objective]
    - **What:** Create lightweight contribution and setup docs for solo or team execution.
    - **Why:** Reduces onboarding friction and enforces consistent review quality.
    - **Depends on:** [P0-T3]
    - **Deliverable:** `.github/pull_request_template.md`, `README.md` setup section.
    - **DoD:** New contributor can run app and quality checks from docs alone.

## Phase 1 — Product/UX Alignment & Architecture (Doc-grounded)
**Goal:** Translate PRD workflow and spec constraints into implementation-ready UX flows, API behavior, and state transitions before coding features.  
**Phase Gate / Exit Criteria:**
- Screen/state flow and API sequence are documented and approved.
- Fixed 3-question behavior, sparse-answer handling, and hidden prompt policy are unambiguous.
- Error and iteration behaviors are fully specified.

- [ ] [P1-T1] Define canonical MVP user flow and state machine [FE] [BE] [Design] [PRD: §4 Core User Journey, §5.3 UI/UX] [SPEC: §3 Stepper UX, §7 Session State]
  - **What:** Document screen flow, transitions, and session states for template select, initial input, Q1–Q3, generating, and result/iterate.
  - **Why:** Prevents frontend/backend mismatch and late flow changes.
  - **Depends on:** [P0-T1], [P0-T2]
  - **Deliverable:** `docs/mvp-flow-state-machine.md`.
  - **DoD:** Every user action maps to a state transition and endpoint call.
  - [ ] [P1-T1.1] Lock fixed questions and sparse-answer behavior [Design] [BE] [PRD: §8 Fixed questions, §8 Guardrails] [SPEC: §5 Cost/Latency Controls]
    - **What:** Specify exact question text/order and one-time re-ask/default fallback rule.
    - **Why:** Keeps prompt refinement deterministic and testable.
    - **Depends on:** [P1-T1]
    - **Deliverable:** Question spec section in `docs/mvp-flow-state-machine.md`.
    - **DoD:** Question order and fallback behavior are explicit and test-case-ready.
  - [ ] [P1-T1.2] Define iteration paths (`generate another`, `change answers`, `start over`) [FE] [BE] [PRD: §4 Primary Flow step 6, §5.3 FR-UX-05] [SPEC: §4 Backend]
    - **What:** Specify backend and UI behavior for each post-result action.
    - **Why:** Avoids ambiguous session mutation behavior later.
    - **Depends on:** [P1-T1]
    - **Deliverable:** Iteration transition table.
    - **DoD:** Each action maps to clear endpoint/state outcomes.

- [ ] [P1-T2] Define system architecture and sequence contracts [BE] [PRD: §7 System Architecture, §8 OpenAI Contract] [SPEC: §4 Backend, §5 OpenAI, §6 NanoBanana]
  - **What:** Produce sequence diagrams for `/api/session/start`, `/api/session/answer`, `/api/generate` including adapter boundaries.
  - **Why:** Contract-first sequencing reduces integration defects.
  - **Depends on:** [P1-T1]
  - **Deliverable:** `docs/architecture-sequence.md`.
  - **DoD:** Diagrams include all endpoints, external calls, and failure branches.
  - [ ] [P1-T2.1] Define server-only data boundaries and redaction policy [BE] [PRD: §5.1 FR-PR-07, §6 Security/Privacy] [SPEC: §4 Backend, §8 Secrets & Config]
    - **What:** Mark what stays server-only (API keys, final prompt, raw provider payloads) and what can be sent to UI.
    - **Why:** Prevents accidental leakage and privacy violations.
    - **Depends on:** [P1-T2]
    - **Deliverable:** Data classification table in architecture doc.
    - **DoD:** All response payloads reviewed against server-only policy.
  - [ ] [P1-T2.2] Define error taxonomy and user-facing copy contract [BE] [Design] [PRD: §9 Error Handling] [SPEC: §9 Observability]
    - **What:** Specify stable error codes and mapped user messages for validation/OpenAI/NanoBanana failures.
    - **Why:** Enables consistent UX and reliable support/debugging.
    - **Depends on:** [P1-T2]
    - **Deliverable:** `docs/error-contract.md`.
    - **DoD:** Every known failure path has code + user message.

- [ ] [P1-T3] Define observability and analytics event model [BE] [QA] [PRD: §5.4 Observability, §10 Analytics] [SPEC: §9 Observability]
  - **What:** Define funnel events, latency metrics, error dimensions, and request-id propagation rules.
  - **Why:** Enables objective MVP success measurement and faster incident triage.
  - **Depends on:** [P1-T2]
  - **Deliverable:** `docs/telemetry-contract.md`.
  - **DoD:** Event schema and log schema are implementation-ready.
  - [ ] [P1-T3.1] Define required funnel events and timing points [BE] [PRD: §10 Analytics] [SPEC: §9 Observability]
    - **What:** Specify required event names: start, refinement started, synthesis, generation request, image success/failure.
    - **Why:** Supports PRD success/funnel tracking.
    - **Depends on:** [P1-T3]
    - **Deliverable:** Event contract table.
    - **DoD:** All success metrics in PRD have measurable event sources.
  - [ ] [P1-T3.2] Define logging fields and redaction rules [BE] [PRD: §5.4 FR-OBS-01] [SPEC: §9 Observability]
    - **What:** Standardize JSON log fields (requestId, endpoint, latencyMs, providerStatus, errorCode) and redaction policy.
    - **Why:** Keeps logs useful while protecting sensitive content.
    - **Depends on:** [P1-T3]
    - **Deliverable:** Logging schema in telemetry doc.
    - **DoD:** Log schema includes no raw secrets and supports incident traceability.

## Phase 2 — Dev Environment + Tooling + CI/CD + Infra Baseline
**Goal:** Stand up reliable local and CI execution, secrets handling, and internal sharing infrastructure before feature implementation scales.  
**Phase Gate / Exit Criteria:**
- Local env can boot with validated `.env` values.
- CI runs lint/test/build on every PR.
- Cloudflare Tunnel workflow is documented and executable.

- [ ] [P2-T1] Implement environment and secrets management baseline [DevOps] [BE] [PRD: §6 Security/Privacy] [SPEC: §8 Secrets & Config]
  - **What:** Add `.env.example`, runtime env validation, and secret mapping for local/CI contexts.
  - **Why:** Prevents runtime failures and secret leakage.
  - **Depends on:** [P0-T2], [P0-T3], [P1-T2.1]
  - **Deliverable:** Env schema validator and setup docs.
  - **DoD:** App fails fast with clear errors when required env vars are missing.
  - [ ] [P2-T1.1] Define required env var contract [BE] [PRD: §7 Security] [SPEC: §8 Secrets & Config]
    - **What:** Define and validate `OPENAI_API_KEY`, `NANOBANANA_API_KEY`, `SESSION_SECRET`, `NANOBANANA_API_URL`.
    - **Why:** Ensures all integrations can initialize safely.
    - **Depends on:** [P2-T1]
    - **Deliverable:** Env schema module.
    - **DoD:** Missing/invalid vars produce typed startup errors.
  - [ ] [P2-T1.2] Document local + CI secret provisioning [DevOps] [PRD: §7 Deployment] [SPEC: §8 Secrets & Config]
    - **What:** Provide instructions for local `.env` setup and CI secret names.
    - **Why:** Avoids misconfiguration during collaboration.
    - **Depends on:** [P2-T1]
    - **Deliverable:** `README.md` env section and CI secret mapping doc.
    - **DoD:** New machine and CI can configure envs without guesswork.

- [ ] [P2-T2] Build CI pipeline and release hygiene baseline [DevOps] [QA] [PRD: §6 Reliability] [SPEC: §11 Dev Tooling]
  - **What:** Configure CI jobs for lint, typecheck, tests, build; define branch and release tagging strategy.
  - **Why:** Enforces quality gates before merge and creates repeatable release mechanics.
  - **Depends on:** [P2-T1], [P0-T3]
  - **Deliverable:** CI workflow files and release process doc.
  - **DoD:** PRs block on failing lint/test/build checks.
  - [ ] [P2-T2.1] Add CI workflow for lint/test/build [DevOps] [QA] [PRD: §6 Reliability] [SPEC: §11 Dev Tooling]
    - **What:** Implement CI pipeline that executes core quality scripts.
    - **Why:** Automates verification and prevents regressions.
    - **Depends on:** [P2-T2]
    - **Deliverable:** `.github/workflows/ci.yml`.
    - **DoD:** CI passes on baseline branch and fails intentionally on broken branch.
  - [ ] [P2-T2.2] Add dependency audit and artifact retention policy [DevOps] [PRD: §6 Security] [SPEC: §11 Dev Tooling]
    - **What:** Add dependency vulnerability scan and CI artifact retention for debugging.
    - **Why:** Improves security posture and release diagnostics.
    - **Depends on:** [P2-T2]
    - **Deliverable:** Extended CI jobs/policies.
    - **DoD:** Dependency scan runs on schedule/PR and results are visible.

- [ ] [P2-T3] Prepare internal sharing infrastructure via Cloudflare Tunnel [DevOps] [PRD: §1 Summary, §7 Deployment] [SPEC: §10 Local Sharing]
  - **What:** Define commands/config for tunnel startup and optional simple access gate.
  - **Why:** Enables partner testing without full cloud deployment.
  - **Depends on:** [P2-T1], [P2-T2]
  - **Deliverable:** `docs/tunnel-runbook.md` and optional gate toggle.
  - **DoD:** Team can start app + tunnel and share working URL.
  - [ ] [P2-T3.1] Create tunnel start scripts and runbook [DevOps] [PRD: §7 Deployment] [SPEC: §10 Local Sharing]
    - **What:** Add documented script(s) for consistent tunnel startup.
    - **Why:** Avoids ad-hoc manual setup errors.
    - **Depends on:** [P2-T3]
    - **Deliverable:** Script or npm/pnpm command + documentation.
    - **DoD:** Fresh clone can expose app in one documented flow.
  - [ ] [P2-T3.2] Decide and implement optional password/access gate [DevOps] [BE] [PRD: §6 Security] [SPEC: §10 Local Sharing]
    - **What:** Choose whether to add simple gate for partner access and implement if approved.
    - **Why:** Balances MVP speed with basic access control.
    - **Depends on:** [P2-T3]
    - **Deliverable:** Decision record and gate implementation (if selected).
    - **DoD:** Access behavior matches documented decision.

## Phase 3 — Data Model + API Contracts + Integration Contracts
**Goal:** Finalize schema and API/integration contracts before core coding to preserve dependency correctness and reduce interface churn.  
**Phase Gate / Exit Criteria:**
- Shared Zod schemas/types exist and are adopted as source of truth.
- Endpoint contracts and external adapter interfaces are versioned and approved.
- Error and telemetry schemas are finalized for implementation.

- [ ] [P3-T1] Define canonical domain schemas and shared TypeScript types [BE] [PRD: §5 Functional Requirements, §7 State] [SPEC: §4 Request/Response Validation, §7 Session State]
  - **What:** Implement Zod schemas and `z.infer` types for templates, session state, step payloads, generation payloads, and errors.
  - **Why:** Prevents contract drift and brittle parsing.
  - **Depends on:** [P1-T1], [P1-T2], [P2-T1]
  - **Deliverable:** `src/schemas/*` and exported shared types.
  - **DoD:** All endpoint payloads and state objects have validated schemas.
  - [ ] [P3-T1.1] Create session and template schemas [BE] [PRD: §5.1 FR-PR-01, FR-PR-08] [SPEC: §7 Session State]
    - **What:** Define typed schema for template metadata and in-memory session fields.
    - **Why:** Stabilizes persistence and endpoint behavior.
    - **Depends on:** [P3-T1]
    - **Deliverable:** Session/template schema modules.
    - **DoD:** Schema tests cover valid/invalid payloads.
  - [ ] [P3-T1.2] Create stepper and generation payload schemas [BE] [PRD: §5.1 FR-PR-02..07, §5.2 FR-NB-01..04] [SPEC: §4 Backend]
    - **What:** Define request/response schemas for start/answer/generate endpoints including `{ error, code }`.
    - **Why:** Enables strict validation and predictable UI integration.
    - **Depends on:** [P3-T1]
    - **Deliverable:** API contract schema modules.
    - **DoD:** All endpoint handlers can import and enforce schemas directly.

- [ ] [P3-T2] Define endpoint contracts and source-of-truth documentation [BE] [FE] [PRD: §7 Backend Endpoints] [SPEC: §4 Astro Server Endpoints]
  - **What:** Publish contract doc for `/api/templates`, `/api/session/start`, `/api/session/answer`, `/api/generate` with examples.
  - **Why:** Keeps frontend/backend aligned and enables test fixture generation.
  - **Depends on:** [P3-T1], [P1-T2.2]
  - **Deliverable:** `docs/api-contracts.md`.
  - **DoD:** FE and BE can implement independently against same contract doc.
  - [ ] [P3-T2.1] Define happy-path and failure responses per endpoint [BE] [PRD: §9 Error Handling] [SPEC: §4 Backend]
    - **What:** Specify response shapes for success, validation error, provider failure, and timeout.
    - **Why:** Removes ambiguity in UI error handling.
    - **Depends on:** [P3-T2]
    - **Deliverable:** Response matrix in API contracts doc.
    - **DoD:** Every endpoint has documented status/code/body combinations.
  - [ ] [P3-T2.2] Define session cookie and request-id behavior [BE] [PRD: §7 State, §5.4 Observability] [SPEC: §7 Session State, §9 Observability]
    - **What:** Specify signed cookie lifecycle and request id propagation in endpoint contracts.
    - **Why:** Ensures consistency for state and logging.
    - **Depends on:** [P3-T2]
    - **Deliverable:** Contract appendix for headers/cookies.
    - **DoD:** Session and request tracing rules are explicit and testable.

- [ ] [P3-T3] Define external provider adapter contracts [BE] [PRD: §8 OpenAI Contract, §5.2 NanoBanana] [SPEC: §5 OpenAI, §6 NanoBanana]
  - **What:** Create interface contracts for OpenAI refinement/synthesis and NanoBanana generation.
  - **Why:** Isolates provider-specific logic and de-risks future migrations.
  - **Depends on:** [P3-T1], [P3-T2]
  - **Deliverable:** Adapter interfaces and typed result unions.
  - **DoD:** Backend core logic depends only on adapter interfaces, not SDK details.
  - [ ] [P3-T3.1] Define OpenAI adapter interface (questions + synthesis) [BE] [PRD: §5.1 FR-PR-03..07, §8 Output] [SPEC: §5 Output Contract]
    - **What:** Define methods to produce next question and `final_nanobanana_prompt` JSON-only output.
    - **Why:** Enforces deterministic workflow and parse safety.
    - **Depends on:** [P3-T3]
    - **Deliverable:** `OpenAIRefinementAdapter` interface and typed outputs.
    - **DoD:** Interface includes parse retry behavior and output length constraints.
  - [ ] [P3-T3.2] Define NanoBanana adapter interface (sync/async variants) [BE] [PRD: §5.2 FR-NB-02] [SPEC: §6 Image Handling]
    - **What:** Define unified generation result type supporting immediate image, polling token, or failure.
    - **Why:** Prevents endpoint redesign when API mode is confirmed.
    - **Depends on:** [P3-T3]
    - **Deliverable:** `NanoBananaAdapter` interface and typed result model.
    - **DoD:** Contract supports URL and base64/blob without API changes.

- [ ] [P3-T4] Finalize telemetry and logging contracts in code [BE] [QA] [PRD: §5.4, §10 Analytics] [SPEC: §9 Observability]
  - **What:** Implement typed event/log schemas from Phase 1 telemetry doc.
  - **Why:** Ensures consistent measurement as implementation begins.
  - **Depends on:** [P1-T3], [P3-T1]
  - **Deliverable:** Telemetry schema module and event constants.
  - **DoD:** All planned events are code-defined with typed payloads.
  - [ ] [P3-T4.1] Define funnel event payload schemas [BE] [PRD: §10 Analytics] [SPEC: §9 Observability]
    - **What:** Add event schema definitions for funnel and timing metrics.
    - **Why:** Enables consistent analytics data collection.
    - **Depends on:** [P3-T4]
    - **Deliverable:** `src/telemetry/events.ts`.
    - **DoD:** Event validation tests pass.
  - [ ] [P3-T4.2] Define provider latency/error log payload schema [BE] [PRD: §5.4 FR-OBS-02] [SPEC: §9 Observability]
    - **What:** Standardize structured log payload format for OpenAI/NanoBanana calls.
    - **Why:** Supports reliable operational monitoring.
    - **Depends on:** [P3-T4]
    - **Deliverable:** `src/telemetry/log-schema.ts`.
    - **DoD:** Logger helpers enforce schema-compliant output.

## Phase 4 — Backend Implementation (Core Services)
**Goal:** Implement session orchestration, refinement/synthesis, and image generation services behind validated Astro endpoints.  
**Phase Gate / Exit Criteria:**
- All four core endpoints are implemented and validated against contracts.
- OpenAI and NanoBanana integrations work through adapter interfaces.
- Structured logging, error handling, and session security are functional.

- [ ] [P4-T1] Implement session middleware and in-memory state service [BE] [PRD: §5.1 FR-PR-08, §7 State] [SPEC: §7 Session State]
  - **What:** Build signed session cookie handling and in-memory session repository.
  - **Why:** Provides the backbone for multi-step refinement flow.
  - **Depends on:** [P3-T1], [P3-T2.2], [P2-T1]
  - **Deliverable:** Session middleware + repository module.
  - **DoD:** Session state persists across steps within same server process.
  - [ ] [P4-T1.1] Implement signed cookie issuance/validation [BE] [PRD: §7 Security] [SPEC: §7 Session State]
    - **What:** Add secure cookie signer/verifier and session binding logic.
    - **Why:** Protects against tampered session identifiers.
    - **Depends on:** [P4-T1]
    - **Deliverable:** Cookie utility and middleware tests.
    - **DoD:** Invalid signatures are rejected with stable error code.
  - [ ] [P4-T1.2] Implement session lifecycle operations [BE] [PRD: §4 Primary Flow] [SPEC: §7 Session State]
    - **What:** Add create/read/update/reset operations for stepper state and iteration actions.
    - **Why:** Enables `change answers` and `start over` behaviors.
    - **Depends on:** [P4-T1]
    - **Deliverable:** Session store module with typed methods.
    - **DoD:** Unit tests cover normal and stale-session paths.

- [ ] [P4-T2] Implement template/session endpoints (`/api/templates`, `/api/session/start`, `/api/session/answer`) [BE] [PRD: §5.1 FR-PR-01..05, §7 Endpoints] [SPEC: §4 Astro Server Endpoints]
  - **What:** Build and validate start/answer progression with fixed 3-step logic.
  - **Why:** Delivers core refinement experience and question progression.
  - **Depends on:** [P4-T1], [P3-T1], [P3-T2], [P3-T3.1]
  - **Deliverable:** Endpoint handlers with schema validation and typed responses.
  - **DoD:** Endpoints pass integration tests for normal, sparse, and invalid inputs.
  - [ ] [P4-T2.1] Implement static template catalog endpoint [BE] [PRD: §4 Template selection, §5.1 FR-PR-01] [SPEC: §4 GET /api/templates]
    - **What:** Return configured template list including `general-cinematic`.
    - **Why:** Supports template-first flow and future template expansion.
    - **Depends on:** [P4-T2]
    - **Deliverable:** `GET /api/templates` route.
    - **DoD:** Response matches contract and includes required template fields.
  - [ ] [P4-T2.2] Implement start and answer stepper orchestration [BE] [PRD: §5.1 FR-PR-03..05, §8 Fixed questions/Guardrails] [SPEC: §5 Cost/Latency Controls]
    - **What:** Handle initial input, question index progression, one-time re-ask, and defaults.
    - **Why:** Enforces PRD-defined stepper behavior and limits.
    - **Depends on:** [P4-T2]
    - **Deliverable:** `POST /api/session/start` and `POST /api/session/answer` routes.
    - **DoD:** Step count never exceeds 3 and behavior matches question policy.

- [ ] [P4-T3] Implement OpenAI refinement/synthesis service via adapter [BE] [PRD: §8 OpenAI Contract, §9 Error Handling] [SPEC: §5 OpenAI Integration]
  - **What:** Add provider-backed service for question refinement (if used) and final prompt synthesis as strict JSON.
  - **Why:** Produces NanoBanana-ready prompt reliably while preserving provider flexibility.
  - **Depends on:** [P3-T3.1], [P2-T1], [P4-T2]
  - **Deliverable:** OpenAI adapter implementation and service tests.
  - **DoD:** Service returns validated `final_nanobanana_prompt` with parse retry and length cap.
  - [ ] [P4-T3.1] Implement strict JSON parse with one retry [BE] [PRD: §8 Output, §11 Risks] [SPEC: §5 Output Contract, §5 Cost/Latency Controls]
    - **What:** Enforce JSON-only output parsing and retry once with strict reminder on parse failure.
    - **Why:** Prevents malformed responses from breaking generation flow.
    - **Depends on:** [P4-T3]
    - **Deliverable:** Parser utility and retry wrapper.
    - **DoD:** Malformed first response with valid second response succeeds in tests.
  - [ ] [P4-T3.2] Enforce prompt length cap and default infill strategy [BE] [PRD: §8 Guardrails] [SPEC: §5 Cost/Latency Controls]
    - **What:** Ensure synthesized prompt respects hard length cap and incorporates defaults when answers are sparse.
    - **Why:** Controls cost/latency and stabilizes output quality.
    - **Depends on:** [P4-T3]
    - **Deliverable:** Prompt post-processing module.
    - **DoD:** Output always within configured length range.

- [ ] [P4-T4] Implement NanoBanana integration and `/api/generate` endpoint [BE] [PRD: §5.2 FR-NB-01..04, §7 Endpoints] [SPEC: §6 NanoBanana Integration]
  - **What:** Build generation pipeline from session to final prompt to image result, including timeout/retry and async handling.
  - **Why:** Delivers primary user value: actual generated image output.
  - **Depends on:** [P4-T2], [P4-T3], [P3-T3.2]
  - **Deliverable:** `POST /api/generate` route and NanoBanana adapter implementation.
  - **DoD:** Endpoint returns image result or actionable error for all supported provider outcomes.
  - [ ] [P4-T4.1] Implement timeout/retry/error mapping for generation calls [BE] [PRD: §9 Error Handling] [SPEC: §6 Timeouts/Retries]
    - **What:** Add guarded call wrapper and map failures to stable user-safe messages/codes.
    - **Why:** Improves reliability and user recovery.
    - **Depends on:** [P4-T4]
    - **Deliverable:** Retry/timeout utility and error mapper.
    - **DoD:** Timeouts and provider failures produce expected error envelope.
  - [ ] [P4-T4.2] Support URL and base64/blob result handling [BE] [PRD: §5.2 FR-NB-03] [SPEC: §6 Image Handling]
    - **What:** Render direct URL when available, or serve internally if binary/base64 is returned.
    - **Why:** Keeps frontend contract stable regardless of provider format.
    - **Depends on:** [P4-T4]
    - **Deliverable:** Image response handling module and optional internal image endpoint.
    - **DoD:** Both result formats render correctly in integration tests.

- [ ] [P4-T5] Add baseline observability and production-sane error handling [BE] [QA] [PRD: §5.4 Observability, §9 Error Handling] [SPEC: §9 Observability]
  - **What:** Integrate structured logging, request IDs, latency measurement, and redacted error reporting across endpoints/services.
  - **Why:** Enables operational debugging and success metric tracking.
  - **Depends on:** [P4-T2], [P4-T3], [P4-T4], [P3-T4]
  - **Deliverable:** Logger utilities, telemetry emitters, consistent error responses.
  - **DoD:** Every endpoint logs requestId, latency, status, and provider outcomes.
  - [ ] [P4-T5.1] Emit funnel and latency events at each stage [BE] [PRD: §10 Analytics] [SPEC: §9 Observability]
    - **What:** Instrument start/refinement/synthesis/generation/success/failure events with timing.
    - **Why:** Supports MVP success criteria and post-launch analysis.
    - **Depends on:** [P4-T5]
    - **Deliverable:** Telemetry integration in endpoint flow.
    - **DoD:** Event stream includes complete funnel coverage in test runs.
  - [ ] [P4-T5.2] Enforce safe client error messaging [BE] [PRD: §9 Error Handling] [SPEC: §4 Backend]
    - **What:** Return stable `{ error, code }` without stack traces or secrets.
    - **Why:** Protects internal details while keeping UX actionable.
    - **Depends on:** [P4-T5]
    - **Deliverable:** Centralized error formatter.
    - **DoD:** Error snapshots match approved message matrix.

## Phase 5 — Frontend Implementation (Core UX)
**Goal:** Implement the minimal, accessible stepper UX that consumes backend contracts and preserves server-driven architecture constraints.  
**Phase Gate / Exit Criteria:**
- All required MVP screens are implemented and connected to contracts.
- Progress, validation, and iteration actions are fully functional.
- Prompt synthesis remains hidden from UI.

- [ ] [P5-T1] Build template selection and initial input screens [FE] [PRD: §5.3 FR-UX-02] [SPEC: §3 Frontend]
  - **What:** Implement SSR pages/components for template selection and single initial constraint input.
  - **Why:** Starts the canonical flow with minimal friction.
  - **Depends on:** [P3-T2], [P4-T2.1]
  - **Deliverable:** Template and initial-input UI components.
  - **DoD:** User can start session with validated input and clear error feedback.
  - [ ] [P5-T1.1] Implement template list UI from `/api/templates` [FE] [PRD: §5.1 FR-PR-01] [SPEC: §4 GET /api/templates]
    - **What:** Fetch and render template cards/options including `general-cinematic`.
    - **Why:** Supports template-first requirement.
    - **Depends on:** [P5-T1]
    - **Deliverable:** Template selection component/page.
    - **DoD:** Selection persists into session start payload.
  - [ ] [P5-T1.2] Implement initial input form with validation [FE] [PRD: §5.1 FR-PR-02] [SPEC: §3 Stepper UX]
    - **What:** Collect single input field and submit to `/api/session/start`.
    - **Why:** Captures required seed context for refinement.
    - **Depends on:** [P5-T1]
    - **Deliverable:** Initial input page/form.
    - **DoD:** Missing/invalid input surfaces validation error before submission.

- [ ] [P5-T2] Build fixed 3-step refinement UI with progress [FE] [PRD: §5.3 FR-UX-01, FR-UX-03] [SPEC: §3 Stepper UX]
  - **What:** Implement question-by-question stepper interface and progress indicator.
  - **Why:** Delivers low-cognitive-load core interaction model.
  - **Depends on:** [P4-T2.2], [P5-T1]
  - **Deliverable:** Stepper components for Q1–Q3 flow.
  - **DoD:** UI correctly displays question index and handles sparse-answer re-ask.
  - [ ] [P5-T2.1] Implement question submission and state transitions [FE] [PRD: §4 Primary Flow step 3, §5.1 FR-PR-04] [SPEC: §3 Stepper UX]
    - **What:** Submit answers to `/api/session/answer` and advance state based on response.
    - **Why:** Connects frontend interaction to backend orchestration.
    - **Depends on:** [P5-T2]
    - **Deliverable:** Stepper submission logic.
    - **DoD:** Stepper never advances beyond allowed steps and handles `done` response.
  - [ ] [P5-T2.2] Implement focus management and keyboard support [FE] [QA] [PRD: §6 Non-Functional Accessibility] [SPEC: §3 Accessibility]
    - **What:** Ensure keyboard navigation and focus placement on question transitions/errors.
    - **Why:** Meets accessibility requirements and improves usability.
    - **Depends on:** [P5-T2]
    - **Deliverable:** Accessible stepper behavior.
    - **DoD:** Keyboard-only flow completes Q1–Q3 without focus traps.

- [ ] [P5-T3] Build generating and result screens with iteration actions [FE] [PRD: §5.3 FR-UX-02, FR-UX-05] [SPEC: §3 Frontend, §6 Image Handling]
  - **What:** Implement generating state and result view with image plus iterate controls.
  - **Why:** Completes end-user value loop and supports rapid internal testing.
  - **Depends on:** [P4-T4], [P5-T2]
  - **Deliverable:** Generating and result pages/components.
  - **DoD:** User can regenerate, change answers, or start over from result screen.
  - [ ] [P5-T3.1] Implement generating state and retry messaging [FE] [PRD: §9 Error Handling] [SPEC: §6 Timeouts/Retries]
    - **What:** Show clear in-progress status and actionable failure/retry options.
    - **Why:** Keeps users informed during potentially slow generation.
    - **Depends on:** [P5-T3]
    - **Deliverable:** Generating state UI + error banner components.
    - **DoD:** Generation failures show safe, mapped messages with retry affordance.
  - [ ] [P5-T3.2] Ensure prompt data never appears client-side [FE] [BE] [PRD: §5.1 FR-PR-07, §5.3 FR-UX-04] [SPEC: §4 Backend]
    - **What:** Confirm UI contracts contain only question/progress/image data and no synthesized prompt text.
    - **Why:** Enforces core MVP privacy/product constraint.
    - **Depends on:** [P5-T3]
    - **Deliverable:** Client contract checks and defensive UI typing.
    - **DoD:** Network inspection and tests confirm no prompt leakage.

- [ ] [P5-T4] Apply responsive styling with minimal client JS [FE] [Design] [PRD: §6 Performance] [SPEC: §3 Frontend]
  - **What:** Implement lightweight styling (Tailwind or CSS modules) with responsive layout and low JS overhead.
  - **Why:** Meets performance target and keeps architecture simple.
  - **Depends on:** [P5-T1], [P5-T2], [P5-T3]
  - **Deliverable:** Polished responsive MVP UI.
  - **DoD:** Pages are usable on desktop/mobile and avoid heavy client bundles.
  - [ ] [P5-T4.1] Choose and configure UI styling path [FE] [PRD: §6 Performance] [SPEC: §3 UI Layer]
    - **What:** Select Tailwind or CSS modules and apply consistently.
    - **Why:** Prevents mixed-style maintenance overhead.
    - **Depends on:** [P5-T4]
    - **Deliverable:** Finalized styling setup.
    - **DoD:** Build output and codebase use one clear styling approach.
  - [ ] [P5-T4.2] Verify progress indicator clarity and mobile ergonomics [FE] [Design] [PRD: §5.3 FR-UX-03] [SPEC: §3 Stepper UX]
    - **What:** Tune spacing/text hierarchy for step progress and actions on small screens.
    - **Why:** Preserves stepper clarity under real usage conditions.
    - **Depends on:** [P5-T4]
    - **Deliverable:** UX polish pass.
    - **DoD:** Internal review confirms readable progress/action controls on mobile.

## Phase 6 — End-to-End Integration + Feature Completion
**Goal:** Complete backend/frontend wiring, finalize all MVP user flows, and ensure provider edge cases are handled without contract breaks.  
**Phase Gate / Exit Criteria:**
- Full flow works end-to-end from template selection to image render.
- Iterate actions function correctly and maintain valid session state.
- Prompt privacy and contract conformance are verified.

- [ ] [P6-T1] Wire frontend API client to production endpoint contracts [FE] [BE] [PRD: §7 Endpoints] [SPEC: §4 Astro Server Endpoints]
  - **What:** Implement API client/fetch wrappers aligned to schema types and cookie-based sessions.
  - **Why:** Establishes robust integration and consistent error handling.
  - **Depends on:** [P3-T2], [P4-T2], [P5-T1], [P5-T2]
  - **Deliverable:** Typed API client layer.
  - **DoD:** All UI calls use typed contracts and mapped error handling.
  - [ ] [P6-T1.1] Add endpoint wrapper methods and response guards [FE] [PRD: §5.3 UI/UX] [SPEC: §4 Request/Response Validation]
    - **What:** Centralize calls to `templates/start/answer/generate` with schema validation.
    - **Why:** Prevents duplicated network logic and silent contract drift.
    - **Depends on:** [P6-T1]
    - **Deliverable:** `src/lib/api-client.ts` (or equivalent).
    - **DoD:** UI components consume only wrapper methods, not raw fetch calls.
  - [ ] [P6-T1.2] Standardize frontend error and retry behavior [FE] [PRD: §9 Error Handling] [SPEC: §9 Observability]
    - **What:** Ensure all error states use approved copy and retry paths.
    - **Why:** Delivers predictable UX under provider failures.
    - **Depends on:** [P6-T1]
    - **Deliverable:** Shared frontend error handling utilities/components.
    - **DoD:** All endpoint failures surface consistent user-facing messages.

- [ ] [P6-T2] Complete iterate behaviors and session reset semantics [FE] [BE] [PRD: §4 Primary Flow step 6, §5.3 FR-UX-05] [SPEC: §7 Session State]
  - **What:** Implement and verify `generate another`, `change answers`, and `start over` end-to-end behavior.
  - **Why:** Enables rapid internal experimentation without broken state transitions.
  - **Depends on:** [P4-T1], [P4-T2], [P5-T3], [P6-T1]
  - **Deliverable:** Stable iteration flow behavior across UI + API.
  - **DoD:** Each action updates state as defined in flow spec with no stale-session errors.
  - [ ] [P6-T2.1] Implement backend reset/update endpoints or handlers as needed [BE] [PRD: §4 Iterate actions] [SPEC: §4 Backend]
    - **What:** Add/adjust backend behavior to support answer edits and full resets.
    - **Why:** Keeps iteration logic server-authoritative and consistent.
    - **Depends on:** [P6-T2]
    - **Deliverable:** Session mutation handlers/routes.
    - **DoD:** Integration tests confirm expected state after each iterate action.
  - [ ] [P6-T2.2] Connect UI controls to iteration handlers [FE] [PRD: §5.3 FR-UX-05] [SPEC: §3 Frontend]
    - **What:** Wire result screen controls to correct backend actions and navigate accordingly.
    - **Why:** Completes intended post-generation UX loop.
    - **Depends on:** [P6-T2]
    - **Deliverable:** Functional iterate controls in result view.
    - **DoD:** Internal walkthrough can repeat cycles without page reload hacks.

- [ ] [P6-T3] Finalize provider edge-case handling end-to-end [BE] [FE] [PRD: §5.2 FR-NB-02, §9 Error Handling] [SPEC: §6 NanoBanana Integration]
  - **What:** Validate async/polling flows, URL/base64 image handling, and failure recovery from UI to API.
  - **Why:** Prevents production-like failures during partner trials.
  - **Depends on:** [P4-T4], [P5-T3], [P6-T1]
  - **Deliverable:** Fully integrated provider edge-path support.
  - **DoD:** All supported provider variants pass integration smoke tests.
  - [ ] [P6-T3.1] Implement polling/status flow if provider is async [BE] [FE] [PRD: §5.2 FR-NB-02] [SPEC: §6 Timeouts/Retries]
    - **What:** Add status polling orchestration and terminal-state handling.
    - **Why:** Supports non-immediate generation APIs without UX dead ends.
    - **Depends on:** [P6-T3]
    - **Deliverable:** Async generation handling path.
    - **DoD:** Async jobs resolve or timeout with actionable UX.
  - [ ] [P6-T3.2] Validate no prompt leakage in integration transport [QA] [BE] [FE] [PRD: §5.1 FR-PR-07] [SPEC: §4 Backend]
    - **What:** Verify payloads/responses never expose `final_nanobanana_prompt` to client.
    - **Why:** Enforces critical product/security behavior.
    - **Depends on:** [P6-T3]
    - **Deliverable:** Integration assertion tests and network inspection checklist.
    - **DoD:** All tests confirm prompt remains server-only.

## Phase 7 — Quality: Testing + Security + Performance + Accessibility + Observability
**Goal:** Validate correctness, resilience, security, and UX quality against PRD success criteria before release.  
**Phase Gate / Exit Criteria:**
- Unit, integration, and e2e smoke suites pass in CI.
- Security and privacy checks pass with no critical findings.
- Performance/accessibility/observability targets are validated.

- [ ] [P7-T1] Implement unit tests for contracts and parsing logic [QA] [BE] [PRD: §11 Risks, §8 Guardrails] [SPEC: §11 Testing, §5 Output Contract]
  - **What:** Add deterministic unit tests for Zod schemas, JSON parse retry, prompt length caps, and fallback defaults.
  - **Why:** Protects the highest-risk logic paths from regressions.
  - **Depends on:** [P3-T1], [P4-T3], [P0-T3]
  - **Deliverable:** Unit test suite with fixtures.
  - **DoD:** Critical parser/guardrail cases are covered and passing.
  - [ ] [P7-T1.1] Add schema validation test matrix [QA] [BE] [PRD: §9 Validation errors] [SPEC: §4 Request/Response Validation]
    - **What:** Test valid/invalid payloads for all endpoint schemas.
    - **Why:** Ensures robust boundary validation.
    - **Depends on:** [P7-T1]
    - **Deliverable:** Schema unit tests.
    - **DoD:** Invalid payloads produce expected errors and codes.
  - [ ] [P7-T1.2] Add synthesis parser resilience tests [QA] [BE] [PRD: §11 Risks] [SPEC: §5 Output Contract]
    - **What:** Test malformed JSON, retry success/failure, and output length enforcement.
    - **Why:** Hardens LLM integration path.
    - **Depends on:** [P7-T1]
    - **Deliverable:** OpenAI parsing unit tests.
    - **DoD:** Parse edge cases are deterministic and passing.

- [ ] [P7-T2] Implement integration and end-to-end smoke tests [QA] [FE] [BE] [PRD: §4 Primary Flow, §5 Functional Requirements] [SPEC: §4 Backend]
  - **What:** Add integration tests for endpoints plus e2e flow tests from template selection to image result.
  - **Why:** Validates full-stack behavior under realistic user paths.
  - **Depends on:** [P6-T1], [P6-T2], [P6-T3], [P2-T2]
  - **Deliverable:** Integration and e2e smoke test suites in CI.
  - **DoD:** Main flow and iterate flows pass reliably in CI.
  - [ ] [P7-T2.1] Add backend integration tests with mocked providers [QA] [BE] [PRD: §5.2 FR-NB-04] [SPEC: §11 Testing]
    - **What:** Test endpoint behavior with mocked OpenAI/NanoBanana success/failure variants.
    - **Why:** Ensures deterministic backend reliability without network dependency.
    - **Depends on:** [P7-T2]
    - **Deliverable:** Endpoint integration test suite.
    - **DoD:** All contract-defined responses are covered.
  - [ ] [P7-T2.2] Add e2e smoke for core MVP journey [QA] [FE] [PRD: §4 Core User Journey, MVP Success Criteria] [SPEC: §3 Stepper UX]
    - **What:** Automate one happy-path run and one failure-recovery run.
    - **Why:** Validates user-visible workflow integrity before release.
    - **Depends on:** [P7-T2]
    - **Deliverable:** E2E smoke tests.
    - **DoD:** Smoke tests run in CI and are stable.

- [ ] [P7-T3] Run security and privacy verification baseline [QA] [BE] [DevOps] [PRD: §6 Security/Privacy] [SPEC: §8 Secrets, §4 Backend]
  - **What:** Verify key handling, response sanitization, validation coverage, and dependency vulnerabilities.
  - **Why:** Prevents avoidable exposure and hard-to-debug incidents.
  - **Depends on:** [P4-T5], [P2-T1], [P2-T2]
  - **Deliverable:** Security checklist report.
  - **DoD:** No critical vulnerabilities or secret exposure paths remain.
  - [ ] [P7-T3.1] Validate server-only secret and prompt boundaries [QA] [BE] [PRD: §6 Security, §5.1 FR-PR-07] [SPEC: §4 Backend, §8 Secrets]
    - **What:** Audit runtime/env/network responses to confirm no keys or final prompt leak client-side.
    - **Why:** Enforces strict data boundary requirements.
    - **Depends on:** [P7-T3]
    - **Deliverable:** Security audit notes with pass/fail items.
    - **DoD:** Audit confirms zero leakage of restricted fields.
  - [ ] [P7-T3.2] Run dependency and header hardening checks [DevOps] [QA] [PRD: §6 Security] [SPEC: §11 Dev Tooling]
    - **What:** Run dependency audit and verify baseline secure headers/CSP strategy if implemented.
    - **Why:** Reduces common web security risk surface.
    - **Depends on:** [P7-T3]
    - **Deliverable:** Security check artifacts from CI/local runs.
    - **DoD:** Findings triaged and critical issues resolved.

- [ ] [P7-T4] Validate performance, accessibility, and observability targets [QA] [FE] [BE] [PRD: §4 MVP Success Criteria, §6 NFR, §5.4] [SPEC: §3 Accessibility, §9 Observability]
  - **What:** Verify page load behavior, end-to-end latency, keyboard accessibility, and required telemetry output.
  - **Why:** Confirms readiness against explicit MVP acceptance criteria.
  - **Depends on:** [P7-T2], [P4-T5], [P5-T4]
  - **Deliverable:** Quality validation report.
  - **DoD:** Metrics and checks meet documented thresholds or have approved exceptions.
  - [ ] [P7-T4.1] Measure time-to-image and page-load performance [QA] [FE] [PRD: §4 MVP Success Criteria, §6 Performance] [SPEC: §1 Objective]
    - **What:** Capture baseline latency for full flow and page load under internal test conditions.
    - **Why:** Validates practical user experience and identifies bottlenecks.
    - **Depends on:** [P7-T4]
    - **Deliverable:** Performance benchmark notes.
    - **DoD:** Report includes mean/percentile times and pass/fail vs target.
  - [ ] [P7-T4.2] Validate keyboard/focus accessibility and telemetry completeness [QA] [FE] [BE] [PRD: §6 Accessibility, §10 Analytics] [SPEC: §3 Accessibility, §9 Observability]
    - **What:** Execute accessibility checklist and verify required funnel/log events are emitted.
    - **Why:** Prevents release with hidden UX/observability gaps.
    - **Depends on:** [P7-T4]
    - **Deliverable:** Accessibility + telemetry validation checklist.
    - **DoD:** Checklist passes with no blocking accessibility or telemetry omissions.

## Phase 8 — Release Prep + Deployment + Launch
**Goal:** Package MVP for reliable internal usage, execute controlled launch, and ensure rollback/operational readiness.  
**Phase Gate / Exit Criteria:**
- Release checklist is complete and signed off.
- Deployment/share path is documented and reproducible.
- Launch readiness criteria and rollback path are validated.

- [ ] [P8-T1] Build release checklist and operational runbooks [DevOps] [QA] [PRD: §1 Summary, §4 Success Criteria] [SPEC: §10 Local Sharing]
  - **What:** Create pre-launch checklist covering env, tests, metrics, and partner validation.
  - **Why:** Prevents ad-hoc launch errors and ensures consistent handoff.
  - **Depends on:** [P7-T1], [P7-T2], [P7-T3], [P7-T4]
  - **Deliverable:** `docs/release-checklist.md` and `docs/runbook.md`.
  - **DoD:** Checklist includes verifiable pass conditions and owners.
  - [ ] [P8-T1.1] Define go/no-go criteria from PRD metrics [QA] [PRD: §4 MVP Success Criteria] [SPEC: §9 Observability]
    - **What:** Translate success criteria into explicit launch thresholds.
    - **Why:** Enables objective launch decisions.
    - **Depends on:** [P8-T1]
    - **Deliverable:** Go/no-go section in release checklist.
    - **DoD:** Thresholds are measurable from telemetry outputs.
  - [ ] [P8-T1.2] Define rollback and incident response steps [DevOps] [BE] [PRD: §9 Error Handling] [SPEC: §10 Local Sharing]
    - **What:** Document how to revert to known-good commit/config and communicate issues.
    - **Why:** Limits downtime during internal testing failures.
    - **Depends on:** [P8-T1]
    - **Deliverable:** Rollback section in runbook.
    - **DoD:** Team can execute rollback steps without improvisation.

- [ ] [P8-T2] Finalize deployment/share pipeline for internal launch [DevOps] [PRD: §7 Deployment] [SPEC: §10 Local Sharing, §13 Open Questions]
  - **What:** Finalize local + tunnel launch flow and optional staging/prod path decision for next step.
  - **Why:** Ensures internal availability and future deployment continuity.
  - **Depends on:** [P2-T3], [P8-T1]
  - **Deliverable:** Launch scripts/config and deployment decision record.
  - **DoD:** Internal users can access stable app URL; next-hosting decision documented.
  - [ ] [P8-T2.1] Validate partner access via Cloudflare Tunnel in dry-run [DevOps] [QA] [PRD: §1 Summary] [SPEC: §10 Local Sharing]
    - **What:** Run a full partner-access rehearsal and validate security/access settings.
    - **Why:** Reduces launch-day connectivity surprises.
    - **Depends on:** [P8-T2]
    - **Deliverable:** Dry-run report with issues/resolutions.
    - **DoD:** Partner can complete end-to-end flow on shared URL.
  - [ ] [P8-T2.2] Document staging/production path if applicable [DevOps] [PRD: §7 Deployment] [SPEC: §13 Open Questions]
    - **What:** If cloud deployment is selected, document env promotion and rollback workflow.
    - **Why:** Satisfies forward deployment readiness without blocking MVP tunnel launch.
    - **Depends on:** [P8-T2]
    - **Deliverable:** Deployment strategy addendum.
    - **DoD:** Path is documented with required secrets and commands.

- [ ] [P8-T3] Execute internal MVP launch and capture baseline metrics [QA] [BE] [FE] [PRD: §4 Success Criteria, §10 Analytics] [SPEC: §9 Observability]
  - **What:** Launch to internal users/partner and collect first-run funnel, latency, and error metrics.
  - **Why:** Confirms operational readiness and validates MVP assumptions.
  - **Depends on:** [P8-T1], [P8-T2]
  - **Deliverable:** Launch report with measured baseline.
  - **DoD:** Launch completed and baseline KPI report produced.
  - [ ] [P8-T3.1] Run scripted acceptance scenario with partner [QA] [PRD: §4 Core User Journey] [SPEC: §1 Objective]
    - **What:** Execute predefined scenario covering start, refinement, generate, and iterate actions.
    - **Why:** Validates real-user journey beyond dev-only testing.
    - **Depends on:** [P8-T3]
    - **Deliverable:** Acceptance scenario results.
    - **DoD:** Scenario passes or blocking issues are documented with owners.
  - [ ] [P8-T3.2] Capture and archive launch telemetry snapshot [BE] [QA] [PRD: §10 Analytics] [SPEC: §9 Observability]
    - **What:** Export initial funnel/latency/error metrics for post-launch comparison.
    - **Why:** Creates baseline for hardening iterations.
    - **Depends on:** [P8-T3]
    - **Deliverable:** Metrics snapshot artifact.
    - **DoD:** Snapshot includes all required KPIs and timestamps.

## Phase 9 — Post-Launch Hardening + Iteration Loop
**Goal:** Close high-impact defects, refine reliability/quality based on telemetry, and prepare documented next-step expansion without scope creep.  
**Phase Gate / Exit Criteria:**
- Post-launch issues are triaged and prioritized by impact.
- Hardening backlog is defined with clear owners and sequencing.
- Future expansion items are captured only from PRD/spec.

- [ ] [P9-T1] Run post-launch triage and reliability hardening loop [BE] [FE] [QA] [PRD: §11 Risks and Mitigations, §10 Analytics] [SPEC: §9 Observability]
  - **What:** Analyze telemetry and issue reports, then execute prioritized fixes for top failure/latency causes.
  - **Why:** Improves MVP stability and output consistency quickly.
  - **Depends on:** [P8-T3]
  - **Deliverable:** Prioritized bug/hardening issue list and completed fixes.
  - **DoD:** Highest-severity launch issues resolved or assigned with target dates.
  - [ ] [P9-T1.1] Create issue backlog from observed launch failures [QA] [BE] [PRD: §9 Error Handling] [SPEC: §9 Observability]
    - **What:** Convert telemetry and partner feedback into actionable tickets with severity labels.
    - **Why:** Ensures structured follow-through.
    - **Depends on:** [P9-T1]
    - **Deliverable:** Triage board with ranked issues.
    - **DoD:** All launch findings are tracked with owner/status.
  - [ ] [P9-T1.2] Patch top reliability and UX pain points [BE] [FE] [PRD: §4 Success Criteria] [SPEC: §1 Objective]
    - **What:** Implement targeted fixes for timeouts, validation friction, and unclear UX states.
    - **Why:** Raises completion rate and trust in outputs.
    - **Depends on:** [P9-T1]
    - **Deliverable:** Hardening patch release.
    - **DoD:** Measured error rate/completion metrics improve vs launch baseline.

- [ ] [P9-T2] Prepare documented next-step architecture for approved expansions [BE] [DevOps] [PRD: §12 Future Expansion] [SPEC: §7 Upgrade Path, §12 Out of Scope]
  - **What:** Draft ADRs/backlog for persistence, auth, billing, richer templates, and policy features as future phases.
  - **Why:** Keeps future work aligned without polluting MVP scope.
  - **Depends on:** [P9-T1]
  - **Deliverable:** Expansion ADRs and roadmap backlog.
  - **DoD:** Future work items are explicit, scoped, and traceable to PRD/spec.
  - [ ] [P9-T2.1] Create persistence migration plan (in-memory to KV/DB) [BE] [PRD: §7 State] [SPEC: §7 Upgrade Path]
    - **What:** Define migration steps, schema implications, and cutover strategy.
    - **Why:** De-risks growth beyond single-process MVP.
    - **Depends on:** [P9-T2]
    - **Deliverable:** Persistence migration ADR.
    - **DoD:** Plan includes data model, rollout order, and rollback.
  - [ ] [P9-T2.2] Create OpenAI provider longevity plan [BE] [PRD: §8 Reality check] [SPEC: §5 API Choice]
    - **What:** If Assistants path is used, schedule migration plan to Responses before deprecation window.
    - **Why:** Avoids forced rewrite near deprecation timeline.
    - **Depends on:** [P9-T2]
    - **Deliverable:** Provider migration backlog with milestones.
    - **DoD:** Milestones are dated and tied to release cycles.

- [ ] [P9-T3] Maintain documentation and operational handoff quality [DevOps] [QA] [PRD: §1 Summary] [SPEC: §1 Objective, §11 Dev Tooling]
  - **What:** Update README/runbooks/ADRs/tests after each hardening cycle.
  - **Why:** Preserves execution continuity for solo developer or team.
  - **Depends on:** [P9-T1], [P9-T2]
  - **Deliverable:** Updated docs and handoff notes.
  - **DoD:** New contributor can run, test, and operate current system from docs only.
  - [ ] [P9-T3.1] Update runbook with recurring incident patterns [DevOps] [PRD: §9 Error Handling] [SPEC: §9 Observability]
    - **What:** Add known failure signatures and mitigation playbooks.
    - **Why:** Reduces mean time to recovery.
    - **Depends on:** [P9-T3]
    - **Deliverable:** Incident patterns section in runbook.
    - **DoD:** Runbook includes reproducible troubleshooting steps.
  - [ ] [P9-T3.2] Refresh quality gates based on defects found [QA] [PRD: §11 Risks] [SPEC: §11 Testing]
    - **What:** Add new regression tests/checks for discovered defects.
    - **Why:** Prevents recurrence of post-launch issues.
    - **Depends on:** [P9-T3]
    - **Deliverable:** Expanded test suite and CI checks.
    - **DoD:** Previously fixed defects have regression coverage.

## Backlog / Future Enhancements
- Add auth, payments, and credit system. [PRD: §12 Future Expansion]
- Add rate limiting and abuse prevention. [PRD: §12 Future Expansion]
- Add optional prompt visibility/editing. [PRD: §12 Future Expansion]
- Add more templates and richer constraints (aspect ratio, style presets). [PRD: §12 Future Expansion]
- Add content warnings and policy-driven messaging. [PRD: §12 Future Expansion]
- Add gallery/history/sharing. [PRD: §12 Future Expansion]
- Replace in-memory session storage with KV/Redis/Postgres. [SPEC: §7 Upgrade Path]
- Add dynamic knowledge-base retrieval via vector store/file search. [PRD: §8 Knowledge base sources]

## Final validation checklist (must appear at the end)
- [ ] All PRD requirements mapped to tasks (no gaps)
- [ ] All spec constraints implemented (no contradictions)
- [ ] No task depends on future work
- [ ] Staging + production deploy paths defined (if applicable)
- [ ] Minimum test coverage + e2e smoke tests included (if applicable)
- [ ] Observability + error handling present (if applicable)
