#!/usr/bin/env bash
set -euo pipefail

# Stable named tunnel using CLOUDFLARE_TUNNEL_TOKEN.
# This is preferred for recurring internal demos.

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared is required. Install from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  exit 1
fi

if [[ -z "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
  echo "CLOUDFLARE_TUNNEL_TOKEN is required for named tunnel mode."
  exit 1
fi

echo "Starting Cloudflare named tunnel from token"
exec cloudflared tunnel --no-autoupdate run --token "${CLOUDFLARE_TUNNEL_TOKEN}"
