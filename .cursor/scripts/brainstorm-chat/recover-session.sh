#!/usr/bin/env bash
# Restore .data from the last APFS snapshot before the accidental wipe (~22:18).
# Requires sudo (macOS will prompt for your password).
set -euo pipefail

SNAP="com.apple.TimeMachine.2026-06-16-202524.local"
MNT="/tmp/brainstorm-snap-recovery"
DIR="/Users/romainpiveteau/Projects/AI/lenue-paris/.cursor/scripts/brainstorm-chat"
DATA_REL="Users/romainpiveteau/Projects/AI/lenue-paris/.cursor/scripts/brainstorm-chat/.data"

echo "Mounting snapshot $SNAP …"
sudo mkdir -p "$MNT"
sudo mount_apfs -s "$SNAP" /System/Volumes/Data "$MNT"

SRC="$MNT/$DATA_REL"
if [[ ! -f "$SRC/messages.jsonl" ]]; then
  echo "messages.jsonl not found in snapshot — aborting."
  sudo umount "$MNT" || true
  exit 1
fi

BYTES=$(wc -c < "$SRC/messages.jsonl" | tr -d ' ')
echo "Found messages.jsonl ($BYTES bytes) in snapshot."

BACKUP="$DIR/.data.wiped-$(date +%Y%m%d-%H%M%S)"
if [[ -d "$DIR/.data" ]]; then
  cp -a "$DIR/.data" "$BACKUP"
  echo "Current .data backed up to $BACKUP"
fi

mkdir -p "$DIR/.data"
cp -a "$SRC/." "$DIR/.data/"
# keep ensure-running.log from current install
[[ -f "$BACKUP/ensure-running.log" ]] && cp "$BACKUP/ensure-running.log" "$DIR/.data/"

sudo umount "$MNT"
echo "Restored .data from snapshot. Restart the server: npm start"
