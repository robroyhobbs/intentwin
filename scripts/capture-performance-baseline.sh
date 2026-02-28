#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

OUT_FILE="docs/plans/performance-baseline.json"
TMP_FILE="$(mktemp)"

measure_seconds() {
  local cmd="$1"
  local start end
  start=$(date +%s)
  eval "$cmd"
  end=$(date +%s)
  echo $((end - start))
}

echo "Capturing IntentWin performance baseline..."

typecheck_seconds="$(measure_seconds "npx tsc --noEmit >/dev/null")"
unit_test_seconds="$(measure_seconds "npm run test:unit >/dev/null")"
build_seconds="$(measure_seconds "npm run build >/dev/null")"

bundle_kb=0
if [[ -d ".next/static/chunks" ]]; then
  bundle_kb="$(du -sk .next/static/chunks | awk '{print $1}')"
fi

timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

cat > "$TMP_FILE" <<EOF
{
  "captured_at": "$timestamp",
  "typecheck_seconds": $typecheck_seconds,
  "unit_test_seconds": $unit_test_seconds,
  "build_seconds": $build_seconds,
  "next_static_chunks_kb": $bundle_kb
}
EOF

mv "$TMP_FILE" "$OUT_FILE"
echo "Wrote $OUT_FILE"
