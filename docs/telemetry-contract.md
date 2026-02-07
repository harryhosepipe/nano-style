# Telemetry Contract

## Purpose
Define MVP events, timing points, and logging schema.

## Funnel Events
| Event | Trigger | Required Fields |
| --- | --- | --- |
| `session_started` | `/api/session/start` success | `requestId`, `sessionId`, `templateId`, `ts` |
| `refinement_answered` | `/api/session/answer` success | `requestId`, `sessionId`, `questionIndex`, `ts` |
| `refinement_completed` | final `/api/session/answer` returns `done: true` | `requestId`, `sessionId`, `questionsCount`, `ts` |
| `synthesis_requested` | before OpenAI synthesis call | `requestId`, `sessionId`, `ts` |
| `synthesis_succeeded` | synthesis success | `requestId`, `sessionId`, `latencyMs`, `ts` |
| `generation_requested` | before NanoBanana call | `requestId`, `sessionId`, `ts` |
| `image_succeeded` | generation success | `requestId`, `sessionId`, `latencyMs`, `ts` |
| `image_failed` | generation failure | `requestId`, `sessionId`, `errorCode`, `latencyMs`, `ts` |

## Timing Points
- `openaiLatencyMs`: synthesis request start -> synthesis response received.
- `nanobananaLatencyMs`: generation request start -> generation response received.
- `timeToImageMs`: session start -> first successful image.

## Structured Log Schema
Required fields for all backend logs:
- `ts`
- `level`
- `requestId`
- `endpoint`
- `sessionId` (if available)
- `event`
- `latencyMs` (if applicable)
- `provider` (`openai` or `nanobanana` where applicable)
- `providerStatus` (if applicable)
- `errorCode` (if applicable)

## Redaction Rules
- Never log API keys, auth headers, or tokens.
- Never log full synthesized prompt in plain text.
- Truncate or hash large user-provided strings when needed.
