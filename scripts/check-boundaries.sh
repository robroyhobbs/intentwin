#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

violations=0

check_forbidden_imports() {
  local scope="$1"
  local pattern="$2"
  local label="$3"

  local out
  out="$(git grep -nE "$pattern" -- "$scope" ':!*.test.ts' ':!*.test.tsx' ':!*.spec.ts' ':!*.spec.tsx' || true)"
  if [[ -n "$out" ]]; then
    echo "Boundary violation: $label"
    echo "$out"
    echo ""
    violations=1
  fi
}

# Platform/backend code must not import app-layer UI modules.
check_forbidden_imports "src/lib" 'from ["'\'']@/app/' "src/lib importing from @/app"
check_forbidden_imports "src/inngest" 'from ["'\'']@/app/' "src/inngest importing from @/app"

if [[ "$violations" -ne 0 ]]; then
  echo "Boundary check failed."
  exit 1
fi

echo "Boundary checks passed."
