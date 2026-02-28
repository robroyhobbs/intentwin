#!/usr/bin/env bash
set -uo pipefail

title="${1:-IntentBid monitor alert}"
details="${2:-Workflow failure detected.}"

sent_any=0
failed_any=0

if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
  payload="$(python3 - "$title" "$details" <<'PY'
import json,sys
print(json.dumps({"text": f"🚨 {sys.argv[1]}\n{sys.argv[2]}"}))
PY
)"
  if curl -sS -X POST -H "Content-Type: application/json" --data "$payload" "$SLACK_WEBHOOK_URL" >/dev/null; then
    sent_any=1
  else
    failed_any=1
    echo "Slack alert failed."
  fi
fi

if [[ -n "${RESEND_API_KEY:-}" && -n "${ALERT_EMAIL_TO:-}" && -n "${ALERT_EMAIL_FROM:-}" ]]; then
  payload="$(python3 - "$title" "$details" "${ALERT_EMAIL_FROM}" "${ALERT_EMAIL_TO}" <<'PY'
import json,sys
print(json.dumps({
  "from": sys.argv[3],
  "to": [sys.argv[4]],
  "subject": f"[IntentBid Alert] {sys.argv[1]}",
  "text": sys.argv[2]
}))
PY
)"
  if curl -sS -X POST "https://api.resend.com/emails" \
    -H "Authorization: Bearer ${RESEND_API_KEY}" \
    -H "Content-Type: application/json" \
    --data "$payload" >/dev/null; then
    sent_any=1
  else
    failed_any=1
    echo "Email alert failed."
  fi
fi

if [[ "$sent_any" -eq 0 ]]; then
  if [[ "$failed_any" -eq 1 ]]; then
    echo "Alert channels configured but none succeeded."
  else
    echo "No alert channel configured; skipping notification."
  fi
else
  echo "Alert sent."
fi
