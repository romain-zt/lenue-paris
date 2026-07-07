#!/usr/bin/env bash
set -euo pipefail

# Minimal monorepo .env for CI (next typegen, seed, etc.)
cat > .env <<EOF
DATABASE_URL=${DATABASE_URL:-}
PAYLOAD_SECRET=${PAYLOAD_SECRET:-}
TEST_DATABASE_URL=${TEST_DATABASE_URL:-}
NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-http://localhost:3001}
EOF
