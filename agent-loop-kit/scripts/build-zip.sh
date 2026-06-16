#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/agent-loop-kit-v0.1.zip"
mkdir -p "$ROOT/dist"

echo "==> Running offline verify before pack"
"$ROOT/verify.sh" --offline
echo "==> Building zip"
rm -f "$OUT"
(cd "$ROOT" && zip -r "$OUT" \
  core/manifest.json core/package.json core/src core/scorers core/tests \
  packs project/templates/*.md project/overlay/.gitkeep \
  bootstrap.sh verify.sh START.md RELEASE-NOTES.md release \
  scripts \
  -x "*.DS_Store" -x "*/.verify-run-a/*" -x "project/build-log.ndjson" -x "project/*.md" -x "project/slice-*" -x "scripts/dist/*")

SHA=$(shasum -a 256 "$OUT" | awk '{print $1}')
echo "$SHA" > "$ROOT/dist/agent-loop-kit-v0.1.zip.sha256"
echo "Built $OUT"
echo "SHA256: $SHA"
