# Environment Variable Contract

This document defines the canonical environment contract for NanoStyle MVP.

## Scope

- Applies to local development, CI, and deployed runtime.
- All secrets stay server-side only and must never be exposed to client code.
- Missing required variables are a startup-blocking misconfiguration.

## Required Variables

| Variable | Required | Format | Purpose |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | yes | non-empty string | Auth for OpenAI synthesis/refinement calls. |
| `OPENAI_PROMPT_ID` | yes | non-empty string | OpenAI stored prompt id used by `responses.create`. |
| `NANOBANANA_API_KEY` | yes | non-empty string | Auth for NanoBanana image generation calls. |
| `NANOBANANA_API_URL` | yes | absolute `http` or `https` URL | Base URL for NanoBanana provider API. |
| `SESSION_SECRET` | yes | non-empty string, minimum 32 chars | Secret used for signing/verifying session cookie values. |

## Optional Variables

| Variable | Default | Allowed values | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, `production` | Runtime mode. |
| `PORT` | framework default | integer 1-65535 | Local server port override for Astro runtime. |
| `OPENAI_PROMPT_VERSION` | `1` | non-empty string | Stored prompt version to pin for `responses.create`. |
| `PROMPT_MAX_CHARS` | `1200` | integer >= 200 | Max synthesized prompt length before truncation. |
| `NANOBANANA_TIMEOUT_MS` | `25000` | integer >= 1000 | Per-request timeout for NanoBanana adapter calls. |
| `NANOBANANA_RETRIES` | `2` | integer >= 1 | Retry attempts for NanoBanana generation call. |
| `ACCESS_GATE_USER` | `nanostyle` | non-empty string | Username for optional basic-auth access gate. |
| `ACCESS_GATE_PASSWORD` | none | non-empty string | Enables optional basic-auth access gate when set. |
| `ACCESS_GATE_REALM` | `NanoStyle Internal` | non-empty string | Browser auth prompt realm for access gate. |
| `CLOUDFLARE_TUNNEL_TOKEN` | none | non-empty string | Token for stable named tunnel mode via `bun run tunnel:token`. |
| `LOCAL_PORT` | `4321` | integer 1-65535 | Port used by `bun run tunnel:quick` to forward local app. |

## Validation Rules

- Treat empty strings as invalid for all required values.
- `NANOBANANA_API_URL` must be parseable as absolute URL and use `http` or `https`.
- `SESSION_SECRET` must be at least 32 characters before the app can serve requests.
- Validation happens at app startup and fails fast with a safe error message that does not print secret values.

## Local Developer Setup

1. Copy `.env.example` to `.env`.
2. Fill all required variables with real values.
3. Run `bun run dev`.

## CI and Runtime Notes

- CI must inject required variables through repository/environment secrets.
- Production/staging variables are managed by deployment platform secret storage, never committed files.
- `.env` remains gitignored; only `.env.example` is committed.
