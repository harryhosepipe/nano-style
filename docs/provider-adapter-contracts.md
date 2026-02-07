# Provider Adapter Contracts

This document defines adapter boundaries for external provider integrations.

Code source:
- OpenAI: `src/services/openai/index.ts`
- NanoBanana: `src/services/nanobanana/index.ts`

## OpenAI Adapter

Interface: `OpenAIAdapter`

Methods:
- `nextQuestion(input)`
  - input: template id, initial input, existing answers, target question index, request id
  - output: `{ questionText }`
- `synthesizePrompt(input)`
  - input: template id, initial input, fixed 3 answers, request id
  - output: `{ nanobananaPrompt, model }`

Contract expectations:
- Never return prompt-internal metadata to client directly.
- Throw provider-mapped errors (`OPENAI_ERROR`, `SYNTHESIS_PARSE_ERROR`, `PROVIDER_TIMEOUT`) for API layer mapping.

## NanoBanana Adapter

Interface: `NanoBananaAdapter`

Methods:
- `generate(input)`
  - output:
    - sync complete: `{ kind: "completed_sync", image, providerRequestId? }`
    - async accepted: `{ kind: "accepted_async", jobId, pollAfterMs }`
- `getStatus(input)`
  - output:
    - pending: `{ status: "pending", pollAfterMs }`
    - completed: `{ status: "completed", image }`
    - failed: `{ status: "failed", retryable, code }`

Contract expectations:
- Adapter normalizes provider shape differences (URL vs base64, sync vs async).
- API layer handles retries/backoff and maps safe user-facing errors.
