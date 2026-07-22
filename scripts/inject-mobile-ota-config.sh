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
# build:android:production:*). In CI (CI env var set) the credentials are required and a
# missing one fails the build; locally they are optional - injection is skipped and the
# committed placeholders are kept, since local builds don't need working OTA.
# NOTE: it mutates the committed files in place - do NOT commit the result; restore
# the placeholders (git checkout) before committing.
#
# Uses STALLION_PROJECT_ID, STALLION_APP_TOKEN and STALLION_PUBLIC_SIGNING_KEY (a single-line
# base64 public key enabling on-device OTA signature verification), from .env or environment.
# Required in CI; optional locally.
# Usage: bash ./scripts/inject-mobile-ota-config.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.env"
  set +a
fi

if [ -z "${STALLION_PROJECT_ID:-}" ] || [ -z "${STALLION_APP_TOKEN:-}" ] || [ -z "${STALLION_PUBLIC_SIGNING_KEY:-}" ]; then
  # OTA updates are published only from CI, so a CI build without these credentials would ship
  # an app that can't pull OTA - fail closed. Local builds don't need working OTA, so let them
  # proceed with the committed placeholders instead of blocking development.
  if [ -n "${CI:-}" ]; then
    echo "Missing STALLION_PROJECT_ID, STALLION_APP_TOKEN or STALLION_PUBLIC_SIGNING_KEY in CI." >&2
    exit 1
  fi
  echo "WARNING: STALLION_PROJECT_ID / STALLION_APP_TOKEN / STALLION_PUBLIC_SIGNING_KEY not set;" >&2
  echo "         skipping injection. This local build keeps the placeholder OTA config and will" >&2
  echo "         not receive OTA updates (fine for local dev)." >&2
  exit 0
fi

IOS_PLIST="$ROOT_DIR/ios/Ambire/Info.plist"
ANDROID_STRINGS="$ROOT_DIR/android/app/src/main/res/values/strings.xml"

# Use sed -i.bak (not -i '') so the same call works on both BSD sed (macOS/iOS runner)
# and GNU sed (Linux/Android runner); the .bak backup is removed right after.
sed -i.bak \
  -e "s/__STALLION_PROJECT_ID__/${STALLION_PROJECT_ID}/g" \
  -e "s/__STALLION_APP_TOKEN__/${STALLION_APP_TOKEN}/g" \
  -e "s|__STALLION_PUBLIC_SIGNING_KEY__|${STALLION_PUBLIC_SIGNING_KEY}|g" \
  "$IOS_PLIST"
rm -f "$IOS_PLIST.bak"

sed -i.bak \
  -e "s/__STALLION_PROJECT_ID__/${STALLION_PROJECT_ID}/g" \
  -e "s/__STALLION_APP_TOKEN__/${STALLION_APP_TOKEN}/g" \
  -e "s|__STALLION_PUBLIC_SIGNING_KEY__|${STALLION_PUBLIC_SIGNING_KEY}|g" \
  "$ANDROID_STRINGS"
rm -f "$ANDROID_STRINGS.bak"

echo "Stallion native config injected successfully."
