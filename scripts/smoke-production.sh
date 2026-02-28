#!/usr/bin/env bash
set -euo pipefail

check_url() {
  local url="$1"
  local name="$2"
  local marker="$3"
  local max_latency_ms="$4"
  local response
  local body
  local code
  local total
  local latency_ms
  response="$(curl -sS -L -w $'\n%{http_code} %{time_total}' "$url")"
  body="${response%$'\n'*}"
  code="$(printf '%s' "${response##*$'\n'}" | awk '{print $1}')"
  total="$(printf '%s' "${response##*$'\n'}" | awk '{print $2}')"
  latency_ms="$(awk -v t="$total" 'BEGIN { printf "%.0f", t * 1000 }')"

  if [[ "$code" -ge 200 && "$code" -lt 400 ]]; then
    echo "PASS: $name ($url) -> $code in ${latency_ms}ms"
  else
    echo "FAIL: $name ($url) -> $code"
    return 1
  fi

  if [[ "$latency_ms" -gt "$max_latency_ms" ]]; then
    echo "FAIL: $name ($url) latency ${latency_ms}ms exceeded ${max_latency_ms}ms"
    return 1
  fi

  if [[ "$body" != *"$marker"* ]]; then
    echo "FAIL: $name ($url) missing content marker: $marker"
    return 1
  fi
}

MAX_LATENCY_MS="${SMOKE_MAX_LATENCY_MS:-5000}"

check_url "https://intentbid.com" "marketing" "Invite-Only Early Access" "$MAX_LATENCY_MS"
check_url "https://app.intentbid.com/login" "app-login" "Create proposals that" "$MAX_LATENCY_MS"
check_url "https://app.intentbid.com" "app-root" "Structured persuasion intelligence" "$MAX_LATENCY_MS"

echo "Production smoke checks passed."
