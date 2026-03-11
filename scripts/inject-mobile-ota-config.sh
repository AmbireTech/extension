#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.env"
  set +a
fi

if [ -z "${STALLION_PROJECT_ID:-}" ] || [ -z "${STALLION_APP_TOKEN:-}" ]; then
  echo "Missing STALLION_PROJECT_ID or STALLION_APP_TOKEN (from .env or environment)." >&2
  exit 1
fi

IOS_PLIST="$ROOT_DIR/ios/Ambire/Info.plist"
ANDROID_STRINGS="$ROOT_DIR/android/app/src/main/res/values/strings.xml"

sed -i '' \
  -e "s/__STALLION_PROJECT_ID__/${STALLION_PROJECT_ID}/g" \
  -e "s/__STALLION_APP_TOKEN__/${STALLION_APP_TOKEN}/g" \
  "$IOS_PLIST"

sed -i '' \
  -e "s/__STALLION_PROJECT_ID__/${STALLION_PROJECT_ID}/g" \
  -e "s/__STALLION_APP_TOKEN__/${STALLION_APP_TOKEN}/g" \
  "$ANDROID_STRINGS"

echo "Stallion native config injected successfully."
