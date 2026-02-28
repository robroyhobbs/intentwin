#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f pnpm-lock.yaml && -f package-lock.json ]]; then
  echo "Error: both pnpm-lock.yaml and package-lock.json are present. Keep one lockfile."
  exit 1
fi

if git ls-files --error-unmatch workspace >/dev/null 2>&1 || \
   git ls-files --error-unmatch .intent >/dev/null 2>&1 || \
   git ls-files --error-unmatch logs >/dev/null 2>&1 || \
   git ls-files --error-unmatch reports >/dev/null 2>&1 || \
   git ls-files --error-unmatch research >/dev/null 2>&1; then
  echo "Error: non-runtime artifact directories are tracked in git."
  echo "Expected untracked: workspace/, .intent/, logs/, reports/, research/"
  exit 1
fi

echo "Repo hygiene checks passed."
