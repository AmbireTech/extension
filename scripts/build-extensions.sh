#!/bin/bash

echo "This script automates the process of building the browser extension and their"
echo "source maps, then packages them into .zip files ready for store submissions 💪\n"

# Exit immediately if a command exits with a non-zero status
set -e

# Get version from app.json
VERSION=$(jq -r '.expo.version' ./app.json)

if [ -z "$VERSION" ]; then
  echo "Version not found in app.json. Make sure the 'expo.version' key exists."
  exit 1
fi

# Run build:web:webkit
echo "Step 1: Building the webkit extension"
yarn build:web:webkit

# Run export:web:webkit:sourcemaps
echo "Step 2: Exporting webkit extension sourcemaps"
yarn export:web:webkit:sourcemaps

# Run build:web:gecko
echo "Step 3: Building the gecko extension"
yarn build:web:gecko

# Run export:web:gecko:sourcemaps
echo "Step 4: Exporting gecko extension sourcemaps"
yarn export:web:gecko:sourcemaps

# Define zip filename bases
WEBKIT_FILENAME="ambire-extension-v${VERSION}-webkit.zip"
GECKO_FILENAME="ambire-extension-v${VERSION}-gecko.zip"
WEBKIT_SOURCEMAPS_FILENAME="ambire-extension-v${VERSION}-webkit-sourcemaps.zip"
GECKO_SOURCEMAPS_FILENAME="ambire-extension-v${VERSION}-gecko-sourcemaps.zip"

# Define build directories
WEBKIT_BUILD_DIR="./build/webkit-prod"
GECKO_BUILD_DIR="./build/gecko-prod"
WEBKIT_SOURCEMAPS_BUILD_DIR="./build/webkit-prod-source-maps"
GECKO_SOURCEMAPS_BUILD_DIR="./build/gecko-prod-source-maps"

# Create zip files
echo "Creating zip files..."
if [ -d "$WEBKIT_BUILD_DIR" ]; then
  (
    cd "$WEBKIT_BUILD_DIR"
    zip -r "../${WEBKIT_FILENAME}" .
  )
  echo "Created $WEBKIT_ZIP"
else
  echo "Error: Directory $WEBKIT_BUILD_DIR does not exist."
  exit 1
fi

if [ -d "$GECKO_BUILD_DIR" ]; then
  (
    cd "$GECKO_BUILD_DIR"
    zip -r "../${GECKO_FILENAME}" .
  )
  echo "Created $GECKO_ZIP"
else
  echo "Error: Directory $GECKO_BUILD_DIR does not exist."
  exit 1
fi

if [ -d "$WEBKIT_SOURCEMAPS_BUILD_DIR" ]; then
  (
    cd "$WEBKIT_SOURCEMAPS_BUILD_DIR"
    zip -r "../${WEBKIT_SOURCEMAPS_FILENAME}" .
  )
  echo "Created $WEBKIT_SOURCEMAPS_ZIP"
else
  echo "Error: Directory $WEBKIT_SOURCEMAPS_BUILD_DIR does not exist."
  exit 1
fi

if [ -d "$GECKO_SOURCEMAPS_BUILD_DIR" ]; then
  (
    cd "$GECKO_SOURCEMAPS_BUILD_DIR"
    zip -r "../${GECKO_SOURCEMAPS_FILENAME}" .
  )
  echo "Created $GECKO_SOURCEMAPS_ZIP"
else
  echo "Error: Directory $GECKO_SOURCEMAPS_BUILD_DIR does not exist."
  exit 1
fi

echo "\nAll ready! Good luck with the build reviews 🤞"
