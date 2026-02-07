# Launch Baseline Snapshot (2026-02-07)

This snapshot records the Phase 8 internal launch rehearsal and baseline telemetry.

## Execution Context

- Date (UTC): `2026-02-07`
- Command: `bun run test src/test/backend-integration.test.ts`
- Result: `2 passed / 2 total`
- Duration: `357ms` total test run

## Acceptance Scenario Coverage

Validated end-to-end flow with mocked providers:
1. `GET /api/templates`
2. `POST /api/session/start`
3. `POST /api/session/answer` (x3)
4. `POST /api/generate`
5. `POST /api/session/reset`

Async provider polling path also validated (`accepted_async` -> poll -> completed image).

## Baseline Telemetry Snapshot

Observed funnel events:
- `session_started`
- `refinement_answered`
- `refinement_completed`
- `synthesis_requested`
- `synthesis_succeeded`
- `generation_requested`
- `image_succeeded`

Observed provider latency logs:
- `openai.synthesize_prompt`: `latencyMs=0`, `providerStatus=success`
- `nanobanana.generate`: `latencyMs=1`, `providerStatus=success`

Observed generation completion latency:
- `image_succeeded.latencyMs=4`

## Notes

- This baseline is a controlled rehearsal with mocked provider responses.
- Live partner validation over external tunnel URL is tracked separately and should be captured in launch-day artifacts.
