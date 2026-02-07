# Cloudflare Tunnel Runbook

This runbook defines how to share the local NanoStyle app internally using Cloudflare Tunnel.

## Prerequisites

- Local app runs via `bun run dev` (default port `4321`).
- `cloudflared` installed and available in `PATH`.

## Mode A: Quick Ephemeral Tunnel

Use for ad-hoc sharing without Cloudflare account setup.

```bash
bun run tunnel:quick
```

Optional port override:

```bash
LOCAL_PORT=3000 bun run tunnel:quick
```

Expected outcome:
- `cloudflared` prints a temporary `https://...trycloudflare.com` URL.
- Share that URL for internal testing.

## Mode B: Stable Named Tunnel (Recommended for repeated use)

Use for recurring partner demos and stable hostname routing.

1. Create tunnel in Cloudflare dashboard.
2. Copy tunnel token.
3. Set `CLOUDFLARE_TUNNEL_TOKEN` in environment.
4. Start tunnel:

```bash
bun run tunnel:token
```

Expected outcome:
- Tunnel binds to configured Cloudflare hostname(s) from dashboard settings.

## Security Notes

- Do not expose admin panels or non-MVP services through the same tunnel.
- Treat tunnel URLs as internal-only.
- For stronger protection, enable the optional access gate:
  - set `ACCESS_GATE_PASSWORD`
  - optional: set `ACCESS_GATE_USER` and `ACCESS_GATE_REALM`
  - then restart app and tunnel

## Troubleshooting

- `cloudflared: command not found`:
  - Install `cloudflared` and retry.
- Tunnel starts but app is unreachable:
  - Confirm local app is running.
  - Confirm `LOCAL_PORT` matches app port.
- Named tunnel auth errors:
  - Re-check `CLOUDFLARE_TUNNEL_TOKEN` value and tunnel status in Cloudflare dashboard.
