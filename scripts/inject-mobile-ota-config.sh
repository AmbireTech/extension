#!/usr/bin/env bash
set -euo pipefail

# Injects the Stallion OTA credentials into the native app config at build time.
#
# The native files (iOS Info.plist, Android strings.xml) are committed with the placeholders
# __STALLION_PROJECT_ID__ / __STALLION_APP_TOKEN__ / __STALLION_PUBLIC_SIGNING_KEY__ so the real
# values never live in git. This script replaces those placeholders with the real values
# (from .env locally, or the CI environment) so the installed app's Stallion SDK
# knows which project/app to pull OTA updates for. This is about the app's identity,
# NOT about publishing a bundle - that is scripts/publish-ota.sh.
#
# It is inlined into the build commands (build:ios:simulator, build:ios:archive,
# build:android:production:*), so it runs the same way locally and in CI.
# NOTE: it mutates the committed files in place - do NOT commit the result; restore
# the placeholders (git checkout) before committing.
#
# Requires STALLION_PROJECT_ID and STALLION_APP_TOKEN. Optionally STALLION_PUBLIC_SIGNING_KEY
# (a single-line base64 public key) to enable OTA signature verification - when empty, the app
# does not verify signatures. (All from .env or environment.)
# Usage: sh ./scripts/inject-mobile-ota-config.sh

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

# Use sed -i.bak (not -i '') so the same call works on both BSD sed (macOS/iOS runner)
# and GNU sed (Linux/Android runner); the .bak backup is removed right after.
sed -i.bak \
  -e "s/__STALLION_PROJECT_ID__/${STALLION_PROJECT_ID}/g" \
  -e "s/__STALLION_APP_TOKEN__/${STALLION_APP_TOKEN}/g" \
  -e "s|__STALLION_PUBLIC_SIGNING_KEY__|${STALLION_PUBLIC_SIGNING_KEY:-}|g" \
  "$IOS_PLIST"
rm -f "$IOS_PLIST.bak"

sed -i.bak \
  -e "s/__STALLION_PROJECT_ID__/${STALLION_PROJECT_ID}/g" \
  -e "s/__STALLION_APP_TOKEN__/${STALLION_APP_TOKEN}/g" \
  -e "s|__STALLION_PUBLIC_SIGNING_KEY__|${STALLION_PUBLIC_SIGNING_KEY:-}|g" \
  "$ANDROID_STRINGS"
rm -f "$ANDROID_STRINGS.bak"

echo "Stallion native config injected successfully."
