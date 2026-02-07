# Error Contract

## Purpose
Define stable error codes and user-safe copy mapping for MVP endpoints.

## Error Envelope
All endpoint failures return:

```json
{
  "ok": false,
  "requestId": "req_123",
  "error": { "code": "STABLE_CODE", "message": "Human-readable message", "retryable": false }
}
```

## Canonical Error Codes
| Code | Applies To | User Message |
| --- | --- | --- |
| `VALIDATION_ERROR` | bad request payload | `Please check your input and try again.` |
| `SESSION_NOT_FOUND` | missing/invalid session | `Your session expired. Start again to continue.` |
| `OPENAI_ERROR` | refinement/synthesis provider failure | `We couldn't refine right now. Please try again.` |
| `SYNTHESIS_PARSE_ERROR` | invalid LLM JSON output | `We hit a formatting issue. Please retry.` |
| `NANOBANANA_ERROR` | image generation provider failure | `Image generation failed. Try generate again.` |
| `PROVIDER_TIMEOUT` | upstream timeout | `The request timed out. Please retry.` |
| `INTERNAL_ERROR` | unclassified backend failure | `Something went wrong. Please try again.` |

## Exposure Rules
- Never include stack traces or raw provider payloads in client responses.
- Never include secrets, tokens, or final synthesized prompt in errors.
- Log full internal diagnostic context server-side with redaction.
