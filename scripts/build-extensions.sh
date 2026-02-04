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

# The order of the commands is crucial! Injecting the debug ids
# before creating the release will result in an empty release!
upload_source_maps_for_build() {
  local ENGINE="$1"

  # Only create a new release if auth token is available
  if [ -n "$SENTRY_AUTH_TOKEN" ]; then
    sentry-cli releases new extension-$ENGINE@$VERSION --project=$SENTRY_PROJECT
  else
    echo "SENTRY_AUTH_TOKEN not available, skipping creating new Sentry release"
  fi

  # Always inject debug IDs (doesn't require auth token), so that the build is
  # deterministic enough to pass the Firefox review process.
  echo "Injecting debug IDs for $ENGINE build"
  sentry-cli sourcemaps inject build/$ENGINE-prod/ --release=extension-$ENGINE@$VERSION --project=$SENTRY_PROJECT

  # Only upload to Sentry if auth token is available
  if [ -n "$SENTRY_AUTH_TOKEN" ]; then
    echo "Uploading source maps for $ENGINE build to Sentry"
    sentry-cli sourcemaps upload --release=extension-$ENGINE@$VERSION --project=$SENTRY_PROJECT build/$ENGINE-prod/
    sentry-cli releases finalize extension-$ENGINE@$VERSION --project=$SENTRY_PROJECT
  else
    echo "SENTRY_AUTH_TOKEN not available, skipping source map upload to Sentry"
  fi
}

# Injects debug ids and optionally uploads source maps to Sentry
# Must be done before separating the source maps from the build directories
prepare_and_upload_sourcemaps() {
  # Always install sentry-cli for debug ID injection, even without auth token

  # Ensure common installation paths are in PATH before installation
  # The Sentry installer typically installs to ~/.local/bin on Linux
  # We put this first so our installed version takes precedence over any system installation
  export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

  echo "Installing sentry-cli..."
  # Install sentry-cli (the installer script handles the installation)
  # It will install to ~/.local/bin/sentry-cli, which is now first in PATH
  curl -sL https://sentry.io/get-cli/ | SENTRY_CLI_VERSION="2.46.0" sh

  # Verify installation succeeded
  if ! command -v sentry-cli &> /dev/null; then
    echo "Error: sentry-cli installation completed but command not found in PATH"
    echo "Current PATH: $PATH"
    echo "Checking common locations..."
    [ -f "$HOME/.local/bin/sentry-cli" ] && echo "Found at $HOME/.local/bin/sentry-cli" || echo "Not found at $HOME/.local/bin/sentry-cli"
    [ -f "/usr/local/bin/sentry-cli" ] && echo "Found at /usr/local/bin/sentry-cli" || echo "Not found at /usr/local/bin/sentry-cli"
    exit 1
  fi

  SENTRY_PROJECT=extension
  sentry-cli --version

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
