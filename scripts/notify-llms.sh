#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: scripts/notify-llms.sh <change-title> <summary>"
  exit 1
fi

cd "$(dirname "$0")/.."

TITLE="$1"
SUMMARY="$2"
LOG_FILE="docs/plans/llm-change-log.md"
STAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if [[ ! -f "$LOG_FILE" ]]; then
  cat > "$LOG_FILE" <<'EOF'
# LLM Change Log

Use this file to keep Claude and other LLMs aligned on architecture and operational changes.
EOF
fi

{
  echo ""
  echo "## $STAMP — $TITLE"
  echo "- $SUMMARY"
} >> "$LOG_FILE"

echo "Logged update to $LOG_FILE"
