#!/bin/bash

# Exit the script immediately if any command fails.
set -e

echo "This script automates the process of building the browser extension and their source maps"
echo "It will also inject debug ids and upload source maps to Sentry"

# Get version from app.json
VERSION=$(grep '"version"' ./app.json | head -n1 | cut -d':' -f2 | tr -d ' ",')

# For some unknown reason, we install a specific version of sentry-cli,
# the output of the installation is that we have installed the correct version,
# but the command `sentry-cli --version` returns an older version.
# Example:
# Sucessfully installed sentry-cli 2.46.0
# Done!
# sentry-cli 2.10.0
# error: Found argument 'inject' which wasn't expected, or isn't valid in this context
SENTRY_CLI_PATH="/usr/local/bin/sentry-cli"

if [ -z "$VERSION" ]; then
  echo "Version not found in app.json. Make sure the 'expo.version' key exists."
  exit 1
fi

# Read the build target
TARGET="$1"

upload_source_maps_for_build() {
  local ENGINE='$1'
  echo "Uploading source maps for $engine build"
  
  # Skip if SENTRY_AUTH_TOKEN is not defined
  if [ -z "$SENTRY_AUTH_TOKEN" ]; then
    echo "SENTRY_AUTH_TOKEN not defined, skipping Sentry source map upload"
    return
  fi

  $SENTRY_CLI_PATH releases new extension-$ENGINE@$VERSION --project=$SENTRY_PROJECT
  $SENTRY_CLI_PATH sourcemaps upload --release=extension-$ENGINE@$VERSION --project=$SENTRY_PROJECT build/$ENGINE-prod/
  $SENTRY_CLI_PATH releases finalize extension-$ENGINE@$VERSION --project=$SENTRY_PROJECT
}

# Injects debug ids and uploads source maps to Sentry
# Must be done before separating the source maps from the build directories
inject_debug_ids() {
  # Check if sentry-cli is installed, if not install it
  if ! command -v sentry-cli &> /dev/null; then
    echo "sentry-cli not found, installing..."
    curl -sL https://sentry.io/get-cli/ | SENTRY_CLI_VERSION="2.46.0" sh
  fi

  SENTRY_PROJECT=extension  
  $SENTRY_CLI_PATH --version
  $SENTRY_CLI_PATH sourcemaps inject build/


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

echo "Step 2: Injecting debug ids and uploading source maps to Sentry"
inject_debug_ids

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
    # Create zip with contents of directory, not the directory itself
    (cd "$dir" && zip -r "../ambire-extension-v${VERSION}-${clean_name}.zip" .)
  fi
done

echo -e "\nAll ready! Good luck with the build reviews 🤞"
