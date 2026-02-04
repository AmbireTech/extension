#!/bin/bash

# Exit the script immediately if any command fails.
set -e

echo "This script automates the process of building the browser extension and their source maps"
echo "It will also inject debug ids and upload source maps to Sentry"

# Get version from app.json
VERSION=$(grep '"version"' ./app.json | head -n1 | cut -d':' -f2 | tr -d ' ",')

if [ -z "$VERSION" ]; then
  echo "Version not found in app.json. Make sure the 'version' key exists."
  exit 1
fi

# Read the build target
TARGET="$1"

# sentry-cli should be available in node_modules/.bin after installing @sentry/cli
# According to Sentry docs: https://docs.sentry.io/cli/installation/#installation-via-npm
# The binary is located at ./node_modules/.bin/sentry-cli
# We use a relative path from the project root (where the script is executed from)
SENTRY_CLI_PATH="./node_modules/.bin/sentry-cli"

# Use the direct path to sentry-cli binary
SENTRY_CLI_CMD="$SENTRY_CLI_PATH"

# The order of the commands is crucial! Injecting the debug ids
# before creating the release will result in an empty release!
upload_source_maps_for_build() {
  local ENGINE="$1"

  # Only create a new release if auth token is available
  if [ -n "$SENTRY_AUTH_TOKEN" ]; then
    $SENTRY_CLI_CMD releases new extension-$ENGINE@$VERSION --project=$SENTRY_PROJECT
  else
    echo "SENTRY_AUTH_TOKEN not available, skipping creating new Sentry release"
  fi

  # Always inject debug IDs (doesn't require auth token), so that the build is
  # deterministic enough to pass the Firefox review process.
  echo "Injecting debug IDs for $ENGINE build"
  $SENTRY_CLI_CMD sourcemaps inject build/$ENGINE-prod/ --release=extension-$ENGINE@$VERSION --project=$SENTRY_PROJECT

  # Only upload to Sentry if auth token is available
  if [ -n "$SENTRY_AUTH_TOKEN" ]; then
    echo "Uploading source maps for $ENGINE build to Sentry"
    $SENTRY_CLI_CMD sourcemaps upload --release=extension-$ENGINE@$VERSION --project=$SENTRY_PROJECT build/$ENGINE-prod/
    $SENTRY_CLI_CMD releases finalize extension-$ENGINE@$VERSION --project=$SENTRY_PROJECT
  else
    echo "SENTRY_AUTH_TOKEN not available, skipping source map upload to Sentry"
  fi
}

# Injects debug ids and optionally uploads source maps to Sentry
# Must be done before separating the source maps from the build directories
prepare_and_upload_sourcemaps() {
  # Verify sentry-cli is available
  # @sentry/cli should be installed as a dev dependency
  # According to Sentry docs, it's located at ./node_modules/.bin/sentry-cli
  if [ ! -f "$SENTRY_CLI_PATH" ]; then
    echo "Error: sentry-cli not found at $SENTRY_CLI_PATH"
    echo "Current directory: $(pwd)"
    echo "Please ensure @sentry/cli is installed as a dev dependency: yarn add -D @sentry/cli"
    exit 1
  fi

  # Make sure it's executable
  chmod +x "$SENTRY_CLI_PATH" 2>/dev/null || true

  SENTRY_PROJECT=extension
  $SENTRY_CLI_CMD --version

  # Decide what to build
  case "$TARGET" in
    --webkit)
      upload_source_maps_for_build webkit
      ;;
    --gecko)
      upload_source_maps_for_build gecko
      ;;
    *)
    # Don't upload gecko source maps if the target isn't specified
    # That is because build-extensions.yml will run this script for both targets
    # but should only upload the source maps for the webkit build
    # as there is a separate workflow for gecko (build-extensions-gecko.yml)
      upload_source_maps_for_build webkit
      ;;
  esac
}

# Function to build and zip Webkit
build_webkit() {
  echo "Step 1: Building the webkit extension"
  yarn build:web:webkit

}

# Function to build and zip Gecko
build_gecko() {
  echo "Step 1: Building the gecko extension"
  yarn build:web:gecko
}

# Decide what to build
case "$TARGET" in
  --webkit)
    build_webkit
    ;;
  --gecko)
    build_gecko
    ;;
  *)
    build_webkit
    build_gecko
    ;;
esac

echo "Step 2: Injecting debug ids and optionally uploading source maps to Sentry"
prepare_and_upload_sourcemaps

echo "Step 3: Separating source maps from the build directories"
case "$TARGET" in
  --webkit)
    yarn export:web:webkit:sourcemaps
    ;;
  --gecko)
    yarn export:web:gecko:sourcemaps
    ;;
  *)
    yarn export:web:webkit:sourcemaps
    yarn export:web:gecko:sourcemaps
    ;;
esac


echo "Step 4: Creating .zip files"
cd build
for dir in */; do
  if [ -d "$dir" ]; then
    # Remove -prod suffix and add prefix with version
    clean_name=$(echo "${dir%/}" | sed 's/-prod//g')

    if [ "$AMBIRE_NEXT" = "true" ]; then
      zip_name="ambire-extension-v${VERSION}-next-${clean_name}.zip"
    else
      zip_name="ambire-extension-v${VERSION}-${clean_name}.zip"
    fi

    # Create zip with contents of directory, not the directory itself
    (cd "$dir" && zip -r "../${zip_name}" .)
  fi
done

echo -e "\nAll ready! Good luck with the build reviews 🤞"
