#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/create-intentbid-repo.sh <name-suffix-or-full-name> [--public|--private]"
  exit 1
fi

RAW_NAME="$1"
VISIBILITY="${2:---private}"

if [[ "$RAW_NAME" == intentbid-* ]]; then
  REPO_NAME="$RAW_NAME"
else
  REPO_NAME="intentbid-$RAW_NAME"
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI is required."
  exit 1
fi

OWNER="$(gh api user -q .login)"
FULL_NAME="$OWNER/$REPO_NAME"

echo "Creating repository: $FULL_NAME"
gh repo create "$FULL_NAME" "$VISIBILITY"
echo "Created $FULL_NAME"
