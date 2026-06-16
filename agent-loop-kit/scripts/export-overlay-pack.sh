#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-./exported-pack}"
mkdir -p "$DEST"
cp -r "$ROOT/packs/saas-landing/"* "$DEST/"
cat >> "$DEST/pack.yaml" <<EOF
derived_from:
  core: 0.1.0
  pack: saas-landing@0.1.0
  overlay_revision: $(date +%Y%m%d)
  exported_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
echo "Exported overlay pack to $DEST"
