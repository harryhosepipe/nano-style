# Secrets Provisioning (Local + CI)

This runbook defines how to provision required NanoStyle secrets for local development and CI.

For variable definitions and validation rules, see `docs/env-contract.md`.

## Required Secrets

- `OPENAI_API_KEY`
- `NANOBANANA_API_KEY`
- `NANOBANANA_API_URL`
- `SESSION_SECRET`

## Local Development

1. Create local env file:
```bash
cp .env.example .env
```
2. Fill required values in `.env`.
3. Generate a strong `SESSION_SECRET` (32+ chars), for example:
```bash
openssl rand -base64 48
```
4. Start app:
```bash
bun run dev
```

Rules:
- Never commit `.env`.
- Never paste secrets into issues, PRs, logs, or screenshots.
- Rotate keys immediately if exposure is suspected.

## GitHub Actions CI

Use repository or environment secrets in GitHub:

1. Open repository settings.
2. Go to `Settings -> Secrets and variables -> Actions`.
3. Add each required secret with exact variable names:
   - `OPENAI_API_KEY`
   - `NANOBANANA_API_KEY`
   - `NANOBANANA_API_URL`
   - `SESSION_SECRET`

When writing workflow files, inject secrets using environment variables:

```yaml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  NANOBANANA_API_KEY: ${{ secrets.NANOBANANA_API_KEY }}
  NANOBANANA_API_URL: ${{ secrets.NANOBANANA_API_URL }}
  SESSION_SECRET: ${{ secrets.SESSION_SECRET }}
```

Notes:
- Keep secrets in GitHub Secrets, not checked-in workflow files.
- Use environment-scoped secrets (for staging/production) once deploy workflows exist.
- PRs from forks do not receive repository secrets by default.

## Verification Checklist

- Local: `bun run dev` starts without configuration errors.
- CI: required secrets exist before enabling workflows that need provider calls.
- Contract drift: if new runtime variables are added, update both `.env.example` and this runbook in the same change.
