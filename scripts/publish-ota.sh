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
# The source map goes to Sentry before publishing. It's written outside --custom-bundle-path so
# Stallion never ships it, and left in build/ so CI can keep a copy. SENTRY_AUTH_TOKEN is required
# in CI and optional locally.
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
SOURCEMAP_DIR="$ROOT_DIR/build/ota-$PLATFORM-sourcemap"
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
rm -rf "$OUT_DIR" "$SOURCEMAP_DIR"
mkdir -p "$OUT_DIR" "$SOURCEMAP_DIR"
APP_ENV=production npx expo export:embed \
  --platform "$PLATFORM" \
  --dev false \
  --reset-cache \
  --bytecode \
  --bundle-output "$OUT_DIR/$BUNDLE_NAME" \
  --sourcemap-output "$SOURCEMAP_DIR/$BUNDLE_NAME.map" \
  --assets-dest "$OUT_DIR"

# 3. Upload the source map with the sentry-cli copy the store builds use. Sentry matches it to
#    crash reports by debug ID, the release only groups the uploads. A bundle without its map's
#    debug ID would still upload fine and then never match, so that fails first.
SENTRY_RN_DIR="$(dirname "$(node -p "require.resolve('@sentry/react-native/package.json')")")"
if ! DEBUG_ID="$(node "$SENTRY_RN_DIR/scripts/has-sourcemap-debugid.js" "$SOURCEMAP_DIR/$BUNDLE_NAME.map")"; then
  echo "ERROR: $DEBUG_ID" >&2
  exit 1
fi
if ! grep -qF "$DEBUG_ID" "$OUT_DIR/$BUNDLE_NAME"; then
  echo "ERROR: the bundle doesn't contain its source map's debug ID $DEBUG_ID, so its crash" >&2
  echo "       reports can't be matched to the map." >&2
  exit 1
fi

if [ -n "${SENTRY_AUTH_TOKEN:-}" ]; then
  APP_VERSION="$(node -p "require('./app.json').version")"
  # Must match getMobileCrashReportRelease, the release the app reports under.
  SENTRY_RELEASE="mobile-$PLATFORM@$APP_VERSION"
  SENTRY_CLI="$(dirname "$(node -p "require.resolve('@sentry/cli/package.json', { paths: [process.argv[1]] })" "$SENTRY_RN_DIR")")/bin/sentry-cli"
  export SENTRY_PROPERTIES="$ROOT_DIR/$PLATFORM/sentry.properties"
  if [ ! -f "$SENTRY_PROPERTIES" ]; then
    echo "ERROR: $SENTRY_PROPERTIES is missing, so the source map has nowhere to go." >&2
    exit 1
  fi

  "$SENTRY_CLI" --version
  "$SENTRY_CLI" releases new "$SENTRY_RELEASE"
  "$SENTRY_CLI" sourcemaps upload \
    --release "$SENTRY_RELEASE" \
    --debug-id-reference \
    "$OUT_DIR/$BUNDLE_NAME" \
    "$SOURCEMAP_DIR/$BUNDLE_NAME.map"
  "$SENTRY_CLI" releases finalize "$SENTRY_RELEASE"
elif [ -n "${CI:-}" ]; then
  # Crash reports from an OTA without its source map can't be read, so CI fails closed.
  echo "ERROR: SENTRY_AUTH_TOKEN is not set in CI. Refusing to publish an OTA whose crash" >&2
  echo "       reports can't be read." >&2
  exit 1
else
  echo "WARNING: SENTRY_AUTH_TOKEN not set; skipping the source map upload. Crash reports from" >&2
  echo "         this OTA will show unreadable stack traces." >&2
fi

# 4. Publish the pre-built bundle to Stallion (--custom-bundle-path bypasses its bundler).
#    Auth: locally the CLI uses your `stallion login` session (~/.stallion/token-store.json).
#    CI has no browser, so a CI token (Stallion dashboard -> project settings) is passed via
#    the STALLION_CI_TOKEN env var when present.
#
# Bundle signing: sign the OTA so app builds with StallionPublicSigningKey embedded accept it
# (and reject tampered/unsigned bundles). This is the real integrity guarantee for OTA'd code -
# the worker bundle (core controllers) ships via OTA, so signed delivery matters. CI provides
# the key base64-encoded via STALLION_PRIVATE_SIGNING_KEY_BASE_64 (decoded to a temp file);
# locally it lives at stallion/secret-keys/private-key.pem (from `stallion generate-key-pair`).
PRIVATE_KEY_PATH=""
if [ -n "${STALLION_PRIVATE_SIGNING_KEY_BASE_64:-}" ]; then
  PRIVATE_KEY_PATH="$(mktemp)"
  trap 'rm -f "$PRIVATE_KEY_PATH"' EXIT
  printf '%s' "$STALLION_PRIVATE_SIGNING_KEY_BASE_64" | base64 --decode > "$PRIVATE_KEY_PATH" 2>/dev/null ||
    printf '%s' "$STALLION_PRIVATE_SIGNING_KEY_BASE_64" | base64 -D > "$PRIVATE_KEY_PATH"
elif [ -f "$ROOT_DIR/stallion/secret-keys/private-key.pem" ]; then
  PRIVATE_KEY_PATH="$ROOT_DIR/stallion/secret-keys/private-key.pem"
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
if [ -z "$PRIVATE_KEY_PATH" ]; then
  # Signing is mandatory: an unsigned bundle would be rejected by every app build with
  # StallionPublicSigningKey embedded, so publishing it is a broken release, never allowed.
  echo "ERROR: no signing key present. Set STALLION_PRIVATE_SIGNING_KEY_BASE_64 (CI) or add" >&2
  echo "       stallion/secret-keys/private-key.pem (local) to sign the OTA. Refusing to publish" >&2
  echo "       UNSIGNED. See https://stalliontech.io/learn/docs/bundle-signing" >&2
  exit 1
fi
publish_args+=(--private-key="$PRIVATE_KEY_PATH")

npx stallion publish-bundle "${publish_args[@]}"

echo "OTA bundle published to $UPLOAD_PATH ($PLATFORM)."
echo "Source map for this bundle: $SOURCEMAP_DIR/$BUNDLE_NAME.map"
