#!/usr/bin/env bash
set -euo pipefail

# Publishes an OTA update to Stallion for the mobile apps.
#
# The OTA bundle MUST be produced exactly like the embedded store bundle, otherwise
# the app crashes after an update (splash screen stays forever). That means:
#   1. Rebuilding the webpack webview/inpage bundles first (build:webview), because
#      they are gitignored JSON files require()-d into the Metro bundle - skipping
#      this ships stale/missing background logic.
#   2. Bundling with Expo's bundler (expo export:embed = expo/metro-config + the
#      .expo/.virtual-metro-entry entry + Hermes bytecode), NOT Stallion's default
#      `react-native bundle` path (which uses @react-native/metro-config and crashed).
#   3. Handing the pre-built bundle to Stallion via --custom-bundle-path so it never
#      runs its own (incompatible) bundler.
#
# Usage: sh ./scripts/publish-ota.sh <ios|android> "<release note>"

PLATFORM="${1:-}"
RELEASE_NOTE="${2:-}"

if [ "$PLATFORM" != "ios" ] && [ "$PLATFORM" != "android" ]; then
  echo "Usage: sh ./scripts/publish-ota.sh <ios|android> \"<release note>\"" >&2
  exit 1
fi

if [ -z "$RELEASE_NOTE" ]; then
  echo "Release note is required. Usage: sh ./scripts/publish-ota.sh $PLATFORM \"<release note>\"" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Stallion bucket. Change here if you push to a different project/bucket.
UPLOAD_PATH="ambire/mobile/main"

OUT_DIR="$ROOT_DIR/build/ota-$PLATFORM"
if [ "$PLATFORM" = "ios" ]; then
  BUNDLE_NAME="main.jsbundle"
else
  BUNDLE_NAME="index.android.bundle"
fi

# 1. Rebuild the webview/inpage bundles (see header).
yarn build:webview

# 2. Bundle with Expo's bundler, matching the embedded store build (see header).
#    --bytecode is required because the app runs on Hermes; without it the bundle is
#    plain JS that Hermes cannot execute. --reset-cache avoids stale Metro cache.
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
APP_ENV=production npx expo export:embed \
  --platform "$PLATFORM" \
  --dev false \
  --reset-cache \
  --bytecode \
  --bundle-output "$OUT_DIR/$BUNDLE_NAME" \
  --assets-dest "$OUT_DIR"

# 3. Publish the pre-built bundle to Stallion (--custom-bundle-path bypasses its bundler).
#    Auth: locally the CLI uses your `stallion login` session (~/.stallion/token-store.json).
#    CI has no browser, so a CI token (Stallion dashboard -> project settings) is passed via
#    the STALLION_CI_TOKEN env var when present.
#
# Bundle signing: sign the OTA so app builds with StallionPublicSigningKey embedded accept it
# (and reject tampered/unsigned bundles). This is the real integrity guarantee for OTA'd code -
# the worker bundle (core controllers) ships via OTA, so signed delivery matters. CI provides
# the key base64-encoded via STALLION_PRIVATE_SIGNING_KEY (decoded to a temp file); locally it
# lives at stallion/secrets/private-key.pem (from `stallion generate-key-pair`).
PRIVATE_KEY_PATH=""
if [ -n "${STALLION_PRIVATE_SIGNING_KEY:-}" ]; then
  PRIVATE_KEY_PATH="$(mktemp)"
  trap 'rm -f "$PRIVATE_KEY_PATH"' EXIT
  printf '%s' "$STALLION_PRIVATE_SIGNING_KEY" | base64 --decode > "$PRIVATE_KEY_PATH" 2>/dev/null ||
    printf '%s' "$STALLION_PRIVATE_SIGNING_KEY" | base64 -D > "$PRIVATE_KEY_PATH"
elif [ -f "$ROOT_DIR/stallion/secrets/private-key.pem" ]; then
  PRIVATE_KEY_PATH="$ROOT_DIR/stallion/secrets/private-key.pem"
fi

publish_args=(
  --platform="$PLATFORM"
  --custom-bundle-path="$OUT_DIR"
  --upload-path="$UPLOAD_PATH"
  --release-note="$RELEASE_NOTE"
)
if [ -n "${STALLION_CI_TOKEN:-}" ]; then
  publish_args+=(--ci-token="$STALLION_CI_TOKEN")
fi
if [ -n "$PRIVATE_KEY_PATH" ]; then
  publish_args+=(--private-key="$PRIVATE_KEY_PATH")
else
  echo "WARNING: publishing UNSIGNED - app builds with StallionPublicSigningKey embedded will" >&2
  echo "         REJECT this OTA. Set STALLION_PRIVATE_SIGNING_KEY (CI) or stallion/secrets/" >&2
  echo "         private-key.pem (local) to sign. See https://stalliontech.io/learn/docs/bundle-signing" >&2
fi

npx stallion publish-bundle "${publish_args[@]}"

echo "OTA bundle published to $UPLOAD_PATH ($PLATFORM)."
