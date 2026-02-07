#!/usr/bin/env bash
set -euo pipefail

# Quick ephemeral tunnel for local sharing.
# Requires local app already running on LOCAL_PORT (default 4321).

LOCAL_PORT="${LOCAL_PORT:-4321}"
LOCAL_URL="http://localhost:${LOCAL_PORT}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared is required. Install from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  exit 1
fi

echo "Starting quick Cloudflare Tunnel to ${LOCAL_URL}"
exec cloudflared tunnel --no-autoupdate --url "${LOCAL_URL}"
