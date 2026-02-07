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
- [ ] P1-T1 Define canonical MVP user flow and state machine
- [ ] P1-T1.1 Lock fixed questions and sparse-answer behavior
- [ ] P1-T1.2 Define iteration paths (`generate another`, `change answers`, `start over`)
- [ ] P1-T2 Define system architecture and sequence contracts
- [ ] P1-T2.1 Define server-only data boundaries and redaction policy
- [ ] P1-T2.2 Define error taxonomy and user-facing copy contract
- [ ] P1-T3 Define observability and analytics event model
- [ ] P1-T3.1 Define required funnel events and timing points
- [ ] P1-T3.2 Define logging fields and redaction rules

## Phase 2 - Dev Environment + Tooling + CI/CD + Infra Baseline
- [ ] P2-T1 Implement environment and secrets management baseline
- [ ] P2-T1.1 Define required env var contract
- [ ] P2-T1.2 Document local + CI secret provisioning
- [ ] P2-T2 Build CI pipeline and release hygiene baseline
- [ ] P2-T2.1 Add CI workflow for lint/test/build
- [ ] P2-T2.2 Add dependency audit and artifact retention policy
- [ ] P2-T3 Prepare internal sharing infrastructure via Cloudflare Tunnel
- [ ] P2-T3.1 Create tunnel start scripts and runbook
- [ ] P2-T3.2 Decide and implement optional password/access gate

## Phase 3 - Data Model + API Contracts + Integration Contracts
- [ ] P3-T1 Define canonical domain schemas and shared TypeScript types
- [ ] P3-T1.1 Create session and template schemas
- [ ] P3-T1.2 Create stepper and generation payload schemas
- [ ] P3-T2 Define endpoint contracts and source-of-truth documentation
- [ ] P3-T2.1 Define happy-path and failure responses per endpoint
- [ ] P3-T2.2 Define session cookie and request-id behavior
- [ ] P3-T3 Define external provider adapter contracts
- [ ] P3-T3.1 Define OpenAI adapter interface (questions + synthesis)
- [ ] P3-T3.2 Define NanoBanana adapter interface (sync/async variants)
- [ ] P3-T4 Finalize telemetry and logging contracts in code
- [ ] P3-T4.1 Define funnel event payload schemas
- [ ] P3-T4.2 Define provider latency/error log payload schema

## Phase 4 - Backend Implementation (Core Services)
- [ ] P4-T1 Implement session middleware and in-memory state service
- [ ] P4-T1.1 Implement signed cookie issuance/validation
- [ ] P4-T1.2 Implement session lifecycle operations
- [ ] P4-T2 Implement template/session endpoints (`/api/templates`, `/api/session/start`, `/api/session/answer`)
- [ ] P4-T2.1 Implement static template catalog endpoint
- [ ] P4-T2.2 Implement start and answer stepper orchestration
- [ ] P4-T3 Implement OpenAI refinement/synthesis service via adapter
- [ ] P4-T3.1 Implement strict JSON parse with one retry
- [ ] P4-T3.2 Enforce prompt length cap and default infill strategy
- [ ] P4-T4 Implement NanoBanana integration and `/api/generate` endpoint
- [ ] P4-T4.1 Implement timeout/retry/error mapping for generation calls
- [ ] P4-T4.2 Support URL and base64/blob result handling
- [ ] P4-T5 Add baseline observability and production-sane error handling
- [ ] P4-T5.1 Emit funnel and latency events at each stage
- [ ] P4-T5.2 Enforce safe client error messaging

## Phase 5 - Frontend Implementation (Core UX)
- [ ] P5-T1 Build template selection and initial input screens
- [ ] P5-T1.1 Implement template list UI from `/api/templates`
- [ ] P5-T1.2 Implement initial input form with validation
- [ ] P5-T2 Build fixed 3-step refinement UI with progress
- [ ] P5-T2.1 Implement question submission and state transitions
- [ ] P5-T2.2 Implement focus management and keyboard support
- [ ] P5-T3 Build generating and result screens with iteration actions
- [ ] P5-T3.1 Implement generating state and retry messaging
- [ ] P5-T3.2 Ensure prompt data never appears client-side
- [ ] P5-T4 Apply responsive styling with minimal client JS
- [ ] P5-T4.1 Choose and configure UI styling path
- [ ] P5-T4.2 Verify progress indicator clarity and mobile ergonomics

## Phase 6 - End-to-End Integration + Feature Completion
- [ ] P6-T1 Wire frontend API client to production endpoint contracts
- [ ] P6-T1.1 Add endpoint wrapper methods and response guards
- [ ] P6-T1.2 Standardize frontend error and retry behavior
- [ ] P6-T2 Complete iterate behaviors and session reset semantics
- [ ] P6-T2.1 Implement backend reset/update endpoints or handlers as needed
- [ ] P6-T2.2 Connect UI controls to iteration handlers
- [ ] P6-T3 Finalize provider edge-case handling end-to-end
- [ ] P6-T3.1 Implement polling/status flow if provider is async
- [ ] P6-T3.2 Validate no prompt leakage in integration transport

## Phase 7 - Quality: Testing + Security + Performance + Accessibility + Observability
- [ ] P7-T1 Implement unit tests for contracts and parsing logic
- [ ] P7-T1.1 Add schema validation test matrix
- [ ] P7-T1.2 Add synthesis parser resilience tests
- [ ] P7-T2 Implement integration and end-to-end smoke tests
- [ ] P7-T2.1 Add backend integration tests with mocked providers
- [ ] P7-T2.2 Add e2e smoke for core MVP journey
- [ ] P7-T3 Run security and privacy verification baseline
- [ ] P7-T3.1 Validate server-only secret and prompt boundaries
- [ ] P7-T3.2 Run dependency and header hardening checks
- [ ] P7-T4 Validate performance, accessibility, and observability targets
- [ ] P7-T4.1 Measure time-to-image and page-load performance
- [ ] P7-T4.2 Validate keyboard/focus accessibility and telemetry completeness

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
