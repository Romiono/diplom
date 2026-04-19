#!/bin/sh
set -e

# ─── Resolve effective public URL ────────────────────────────────────────────
# TUNNEL_URL is set in docker-compose from the root .env file.
# Falls back to localhost so the app at least starts without TonConnect.
APP_URL="${TUNNEL_URL:-http://localhost:3001}"

echo "[entrypoint] Using APP_URL=${APP_URL}"

# ─── Write .env.local ─────────────────────────────────────────────────────────
# next dev reads this file at startup. Written fresh each container start so
# the tunnel URL is always up to date.
WS_URL="${APP_URL:-http://localhost:3000}"

cat > /app/.env.local <<EOF
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_WS_URL=${WS_URL}
NEXT_PUBLIC_APP_URL=${APP_URL}
NEXT_PUBLIC_TON_NETWORK=${NEXT_PUBLIC_TON_NETWORK:-testnet}
NEXT_PUBLIC_DEFAULT_LOCALE=ru
EOF

# ─── Write tonconnect-manifest.json ──────────────────────────────────────────
# This file is served as a static asset and must use the public HTTPS URL.
# It is in the mounted ./frontend/public volume, so the change is visible on
# the host and immediately served by Next.js without a restart.
cat > /app/public/tonconnect-manifest.json <<EOF
{
  "url": "${APP_URL}",
  "name": "TON Marketplace",
  "iconUrl": "${APP_URL}/globe.svg"
}
EOF

echo "[entrypoint] tonconnect-manifest.json updated"

# ─── Start Next.js dev server ─────────────────────────────────────────────────
if [ "$NODE_ENV" = "production" ]; then
  exec npm run start
else
  exec npm run dev
fi
