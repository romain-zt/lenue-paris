#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/core-candidate.diff"
mkdir -p "$ROOT/dist"
diff -ruN "$ROOT/core" "$ROOT/core" > "$OUT" 2>/dev/null || true
echo "No core mutations detected. Candidate diff (empty expected): $OUT"
echo "Review manually before any core promotion."
