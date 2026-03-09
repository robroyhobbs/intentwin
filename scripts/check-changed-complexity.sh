#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

BASE_REF="${GITHUB_BASE_REF:-}"
if [[ -z "$BASE_REF" ]]; then
  echo "No GITHUB_BASE_REF set; skipping changed-file complexity check."
  exit 0
fi

git fetch --no-tags --depth=1 origin "$BASE_REF" >/dev/null 2>&1 || true

changed_files="$(git diff --name-only "origin/$BASE_REF"...HEAD -- 'src/**/*.ts' 'src/**/*.tsx' || true)"
changed_files="$(printf '%s\n' "$changed_files" | grep -Ev '(^|/)(__tests__/|.*\.test\.tsx?$)' || true)"
if [[ -z "$changed_files" ]]; then
  echo "No changed TypeScript files under src/; skipping complexity check."
  exit 0
fi

echo "Running complexity guardrail on changed files against origin/$BASE_REF..."
echo "$changed_files"

# Focus on architectural complexity budgets for newly touched files.
npx eslint --max-warnings 0 \
  --rule 'max-lines:["error",{"max":300,"skipBlankLines":true,"skipComments":true}]' \
  --rule 'max-lines-per-function:["error",{"max":50,"skipBlankLines":true,"skipComments":true,"IIFEs":true}]' \
  --rule 'max-depth:["error",4]' \
  --rule 'max-params:["error",5]' \
  $changed_files
