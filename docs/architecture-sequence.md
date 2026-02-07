# Architecture Sequence Contracts

## Purpose
Define request sequencing and service boundaries for MVP endpoints.

## High-Level Boundaries
- Frontend calls Astro server endpoints only.
- Astro backend orchestrates OpenAI + NanoBanana adapters.
- Session state is server-side only.
- Final synthesized prompt is server-only.

## Core Sequence: Start Session
1. UI sends `POST /api/session/start` with `templateId`, `initial`.
2. Backend validates payload (Zod).
3. Backend creates or updates session.
4. Backend sets `questionIndex = 1` and returns canonical Q1 text.

Response contract:
- success: `{ ok: true, requestId, sessionId, questionIndex: 1, questionText }`
- failure: `{ ok: false, requestId, error: { code, message, retryable } }`

## Core Sequence: Answer Question
1. UI sends `POST /api/session/answer` with `sessionId`, `answer`.
2. Backend validates session + payload.
3. Backend applies sparse-answer rule (re-ask once, then default).
4. Backend either:
   - returns next question, or
   - marks refinement done (`done: true`).

Response contract:
- next: `{ ok: true, requestId, done: false, questionIndex, questionText }`
- done: `{ ok: true, requestId, done: true }`
- failure: `{ ok: false, requestId, error: { code, message, retryable } }`

## Core Sequence: Generate Image
1. UI sends `POST /api/generate` with `sessionId`.
2. Backend validates session completeness.
3. Backend calls OpenAI adapter to synthesize `final_nanobanana_prompt`.
4. Backend enforces prompt length cap and parse safeguards.
5. Backend calls NanoBanana adapter with final prompt.
6. Backend returns image reference payload.

Response contract:
- success: `{ ok: true, requestId, image }`
- failure: `{ ok: false, requestId, error: { code, message, retryable } }`

## Adapter Interfaces
OpenAI adapter:
- input: `template`, `initialInput`, `answers[3]`
- output: `{ nanobanana_prompt: string }`

NanoBanana adapter:
- input: `{ prompt: string }`
- output: `{ imageUrl }` or `{ imageBase64 }` (adapter-normalized shape)

## Failure Branches
- Validation error: `VALIDATION_ERROR`
- Session missing/expired: `SESSION_NOT_FOUND`
- OpenAI provider error: `OPENAI_ERROR`
- Synthesis parse error: `SYNTHESIS_PARSE_ERROR`
- NanoBanana provider error: `NANOBANANA_ERROR`
- Upstream timeout: `PROVIDER_TIMEOUT`
