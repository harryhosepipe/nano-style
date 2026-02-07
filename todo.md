# TODO


## Phase 0 - Foundations & Repo Setup
- [x] P0-T1 Establish requirement traceability matrix and architecture decision log
- [x] P0-T1.1 Capture MVP scope and explicit non-goals in docs
- [x] P0-T1.2 Record unresolved architecture decisions as tracked items
- [x] P0-T2 Scaffold Astro SSR app with TypeScript strict and canonical project structure
- [x] P0-T2.1 Configure runtime/tool versions and scripts
- [x] P0-T2.2 Create baseline folder layout for contracts and adapters
- [x] P0-T3 Configure quality tooling and contribution guardrails
- [x] P0-T3.1 Add lint/format/typecheck configuration
- [x] P0-T3.2 Add PR template, commit conventions, and README bootstrap

## Phase 1 - Product/UX Alignment & Architecture (Doc-grounded)
- [x] P1-T1 Define canonical MVP user flow and state machine
- [x] P1-T1.1 Lock fixed questions and sparse-answer behavior
- [x] P1-T1.2 Define iteration paths (`generate another`, `change answers`, `start over`)
- [x] P1-T2 Define system architecture and sequence contracts
- [x] P1-T2.1 Define server-only data boundaries and redaction policy
- [x] P1-T2.2 Define error taxonomy and user-facing copy contract
- [x] P1-T3 Define observability and analytics event model
- [x] P1-T3.1 Define required funnel events and timing points
- [x] P1-T3.2 Define logging fields and redaction rules

## Phase 2 - Dev Environment + Tooling + CI/CD + Infra Baseline
- [x] P2-T1 Implement environment and secrets management baseline
- [x] P2-T1.1 Define required env var contract
- [x] P2-T1.2 Document local + CI secret provisioning
- [x] P2-T2 Build CI pipeline and release hygiene baseline
- [x] P2-T2.1 Add CI workflow for lint/test/build
- [x] P2-T2.2 Add dependency audit and artifact retention policy
- [x] P2-T3 Prepare internal sharing infrastructure via Cloudflare Tunnel
- [x] P2-T3.1 Create tunnel start scripts and runbook
- [x] P2-T3.2 Decide and implement optional password/access gate

## Phase 3 - Data Model + API Contracts + Integration Contracts
- [x] P3-T1 Define canonical domain schemas and shared TypeScript types
- [x] P3-T1.1 Create session and template schemas
- [x] P3-T1.2 Create stepper and generation payload schemas
- [x] P3-T2 Define endpoint contracts and source-of-truth documentation
- [x] P3-T2.1 Define happy-path and failure responses per endpoint
- [x] P3-T2.2 Define session cookie and request-id behavior
- [x] P3-T3 Define external provider adapter contracts
- [x] P3-T3.1 Define OpenAI adapter interface (questions + synthesis)
- [x] P3-T3.2 Define NanoBanana adapter interface (sync/async variants)
- [x] P3-T4 Finalize telemetry and logging contracts in code
- [x] P3-T4.1 Define funnel event payload schemas
- [x] P3-T4.2 Define provider latency/error log payload schema

## Phase 4 - Backend Implementation (Core Services)
- [x] P4-T1 Implement session middleware and in-memory state service
- [x] P4-T1.1 Implement signed cookie issuance/validation
- [x] P4-T1.2 Implement session lifecycle operations
- [x] P4-T2 Implement template/session endpoints (`/api/templates`, `/api/session/start`, `/api/session/answer`)
- [x] P4-T2.1 Implement static template catalog endpoint
- [x] P4-T2.2 Implement start and answer stepper orchestration
- [x] P4-T3 Implement OpenAI refinement/synthesis service via adapter
- [x] P4-T3.1 Implement strict JSON parse with one retry
- [x] P4-T3.2 Enforce prompt length cap and default infill strategy
- [x] P4-T4 Implement NanoBanana integration and `/api/generate` endpoint
- [x] P4-T4.1 Implement timeout/retry/error mapping for generation calls
- [x] P4-T4.2 Support URL and base64/blob result handling
- [x] P4-T5 Add baseline observability and production-sane error handling
- [x] P4-T5.1 Emit funnel and latency events at each stage
- [x] P4-T5.2 Enforce safe client error messaging

## Phase 5 - Frontend Implementation (Core UX)
- [x] P5-T1 Build template selection and initial input screens
- [x] P5-T1.1 Implement template list UI from `/api/templates`
- [x] P5-T1.2 Implement initial input form with validation
- [x] P5-T2 Build fixed 3-step refinement UI with progress
- [x] P5-T2.1 Implement question submission and state transitions
- [x] P5-T2.2 Implement focus management and keyboard support
- [x] P5-T3 Build generating and result screens with iteration actions
- [x] P5-T3.1 Implement generating state and retry messaging
- [x] P5-T3.2 Ensure prompt data never appears client-side
- [x] P5-T4 Apply responsive styling with minimal client JS
- [x] P5-T4.1 Choose and configure UI styling path
- [x] P5-T4.2 Verify progress indicator clarity and mobile ergonomics

## Phase 6 - End-to-End Integration + Feature Completion
- [x] P6-T1 Wire frontend API client to production endpoint contracts
- [x] P6-T1.1 Add endpoint wrapper methods and response guards
- [x] P6-T1.2 Standardize frontend error and retry behavior
- [x] P6-T2 Complete iterate behaviors and session reset semantics
- [x] P6-T2.1 Implement backend reset/update endpoints or handlers as needed
- [x] P6-T2.2 Connect UI controls to iteration handlers
- [x] P6-T3 Finalize provider edge-case handling end-to-end
- [x] P6-T3.1 Implement polling/status flow if provider is async
- [x] P6-T3.2 Validate no prompt leakage in integration transport

## Phase 7 - Quality: Testing + Security + Performance + Accessibility + Observability
- [x] P7-T1 Implement unit tests for contracts and parsing logic
- [x] P7-T1.1 Add schema validation test matrix
- [x] P7-T1.2 Add synthesis parser resilience tests
- [x] P7-T2 Implement integration and end-to-end smoke tests
- [x] P7-T2.1 Add backend integration tests with mocked providers
- [x] P7-T2.2 Add e2e smoke for core MVP journey
- [x] P7-T3 Run security and privacy verification baseline
- [x] P7-T3.1 Validate server-only secret and prompt boundaries
- [x] P7-T3.2 Run dependency and header hardening checks
- [x] P7-T4 Validate performance, accessibility, and observability targets
- [x] P7-T4.1 Measure time-to-image and page-load performance
- [x] P7-T4.2 Validate keyboard/focus accessibility and telemetry completeness

## Phase 8 - Release Prep + Deployment + Launch
- [ ] P8-T1 Build release checklist and operational runbooks
- [ ] P8-T1.1 Define go/no-go criteria from PRD metrics
- [ ] P8-T1.2 Define rollback and incident response steps
- [ ] P8-T2 Finalize deployment/share pipeline for internal launch
- [ ] P8-T2.1 Validate partner access via Cloudflare Tunnel in dry-run
- [ ] P8-T2.2 Document staging/production path if applicable
- [ ] P8-T3 Execute internal MVP launch and capture baseline metrics
- [ ] P8-T3.1 Run scripted acceptance scenario with partner
- [ ] P8-T3.2 Capture and archive launch telemetry snapshot

## Phase 9 - Post-Launch Hardening + Iteration Loop
- [ ] P9-T1 Run post-launch triage and reliability hardening loop
- [ ] P9-T1.1 Create issue backlog from observed launch failures
- [ ] P9-T1.2 Patch top reliability and UX pain points
- [ ] P9-T2 Prepare documented next-step architecture for approved expansions
- [ ] P9-T2.1 Create persistence migration plan (in-memory to KV/DB)
- [ ] P9-T2.2 Create OpenAI provider longevity plan
- [ ] P9-T3 Maintain documentation and operational handoff quality
- [ ] P9-T3.1 Update runbook with recurring incident patterns
- [ ] P9-T3.2 Refresh quality gates based on defects found

## Backlog
- [ ] Add auth, payments, and credit system.
- [ ] Add rate limiting and abuse prevention.
- [ ] Add optional prompt visibility/editing.
- [ ] Add more templates and richer constraints (aspect ratio, style presets).
- [ ] Add content warnings and policy-driven messaging.
- [ ] Add gallery/history/sharing.
- [ ] Replace in-memory session storage with KV/Redis/Postgres.
- [ ] Add dynamic knowledge-base retrieval via vector store/file search.

## Final Validation
- [ ] All PRD requirements mapped to tasks (no gaps)
- [ ] All spec constraints implemented (no contradictions)
- [ ] No task depends on future work
- [ ] Staging + production deploy paths defined (if applicable)
- [ ] Minimum test coverage + e2e smoke tests included (if applicable)
- [ ] Observability + error handling present (if applicable)
