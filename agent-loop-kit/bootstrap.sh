#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
IDEA="${1:-A SaaS waitlist landing page for indie developers}"
PACK="${PACK:-saas-landing}"

echo "==> Agent Loop Kit v0.1 bootstrap"
echo "    Idea: $IDEA"
echo "    Pack: $PACK"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node 20 LTS required. Install from https://nodejs.org"
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [[ "$NODE_MAJOR" != "20" ]]; then
  echo "WARN: Node 20 LTS recommended (found v$(node -v))"
fi

mkdir -p "$ROOT/project/overlay"
cp -n "$ROOT/project/templates/"*.md "$ROOT/project/" 2>/dev/null || true

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "==> No OPENAI_API_KEY — running offline demo loop"
  node "$ROOT/core/src/loopd.mjs" --offline --idea "$IDEA"
else
  echo "==> Running live loop (ceilings: 12 calls / 8 min / \$0.80)"
  node "$ROOT/core/src/loopd.mjs" --idea "$IDEA"
fi

echo ""
echo "==> Artifacts written to project/"
echo "    Next: review project/first-slice-brief.md and approve slice at veto if checkpoint exists"
