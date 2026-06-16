#!/usr/bin/env sh
set -euo pipefail
cd "$(dirname "$0")"
rm -f ignition-kit.zip
(cd ignition-kit && zip -r ../ignition-kit.zip . -x "*.DS_Store")
zip ignition-kit.zip START.md
echo "Built ignition-kit.zip ($(wc -c < ignition-kit.zip) bytes)"
