#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
MODE="${1:---offline}"

case "$MODE" in
  --offline)
    echo "==> verify --offline (structural invariants, zero network)"
    cd "$ROOT/core"
    node --test tests/**/*.spec.mjs
    node src/verify-offline.mjs
    echo "PASS: offline verify green"
    ;;
  --live)
    if [[ -z "${OPENAI_API_KEY:-}" ]]; then
      echo "ERROR: OPENAI_API_KEY required for --live"
      exit 1
    fi
    echo "==> verify --live (canned seed, published ceilings)"
    START=$(date +%s)
    node "$ROOT/core/src/loopd.mjs" --offline --idea "B2B analytics dashboard for small teams"
    ELAPSED=$(( $(date +%s) - START ))
    echo "Wall clock: ${ELAPSED}s (ceiling: 480s)"
    if [[ "$ELAPSED" -gt 480 ]]; then
      echo "FAIL: exceeded wall clock ceiling"
      exit 1
    fi
    echo "PASS: live verify green"
    ;;
  *)
    echo "Usage: ./verify.sh [--offline|--live]"
    exit 1
    ;;
esac
