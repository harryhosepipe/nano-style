# API Contract (MVP)

This document is the source-of-truth HTTP contract for Phase 3.

Code source:
- `src/schemas/api.ts`
- `src/api/contracts.ts`

## Endpoint Set

- `GET /api/templates`
- `POST /api/session/start`
- `POST /api/session/answer`
- `POST /api/session/reset`
- `POST /api/generate`

## Request-ID Contract

- Header: `x-request-id` (`REQUEST_ID_HEADER` in `src/api/contracts.ts`)
- Behavior:
  - Client may send `x-request-id`.
  - Server generates one if missing.
  - Server includes `requestId` in every JSON response.
  - Server returns the same value in response header `x-request-id`.

## Session Cookie Contract

- Cookie name: `nanostyle.sid` (`SESSION_COOKIE_NAME`)
- Scope:
  - `HttpOnly`: `true`
  - `SameSite`: `lax`
  - `Path`: `/`
  - `Max-Age`: `43200` seconds (12h)
- Session ids are opaque values; clients must not infer data from cookie contents.

## Response Envelope

Success:

```json
{ "ok": true, "requestId": "req_123", "...": "endpoint specific fields" }
```

Failure:

```json
{
  "ok": false,
  "requestId": "req_123",
  "error": { "code": "VALIDATION_ERROR", "message": "Please check your input and try again.", "retryable": false }
}
```

## Endpoint Contracts

### `GET /api/templates`

Success:
- `{ ok, requestId, templates }`

Failure:
- error envelope

### `POST /api/session/start`

Request:
- `{ templateId, initial }`

Success:
- `{ ok, requestId, sessionId, questionIndex: 1, questionText }`

Failure:
- error envelope

### `POST /api/session/answer`

Request:
- `{ sessionId, answer, editFromQuestionIndex? }`

Success (next question):
- `{ ok, requestId, done: false, questionIndex, questionText }`

Success (refinement complete):
- `{ ok, requestId, done: true }`

Failure:
- error envelope

### `POST /api/session/reset`

Request:
- `{ sessionId? }`

Success:
- `{ ok, requestId, reset: true }`

Failure:
- error envelope

### `POST /api/generate`

Request:
- `{ sessionId }`

Success:
- `{ ok, requestId, image }`
  - `image` supports:
    - `{ type: "url", url, mimeType? }`
    - `{ type: "base64", base64, mimeType }`

Failure:
- error envelope
