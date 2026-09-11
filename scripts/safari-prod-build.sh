#!/bin/bash

SCRIPTS_DIR="$(dirname "$(realpath "$0")")"
PROJECT_ROOT="$(cd "$SCRIPTS_DIR"; while [ ! -f "README.md" ] && [ "$PWD" != "/" ]; do cd ..; done; pwd)"
SAFARI_XCODE_PROJECT_PROD="$PROJECT_ROOT/safari-extension/wallet"
# The folder that holds the build outputs, honouring the optional BUILD_DIR env
BUILD_DIR="$(cd "$PROJECT_ROOT" && node -p "require('./webpack/env').buildDir")"
SAFARI_PROD_DIR="$BUILD_DIR/safari-prod"

rm -rf "$SAFARI_PROD_DIR"

if [ ! -d "$SAFARI_XCODE_PROJECT_PROD" ]; then
  mkdir ./safari-extension/wallet
  chmod 777 ./safari-extension/wallet
  APP_ENV=production WEB_ENGINE=webkit-safari WEBPACK_BUILD_OUTPUT_PATH=safari-prod expo export:web &&
  yes | xcrun "/Applications/Xcode.app/Contents/Developer/usr/bin/safari-web-extension-converter" "$SAFARI_PROD_DIR" --app-name "wallet" --bundle-identifier "com.ambire.app.wallet" --project-location "$PROJECT_ROOT/safari-extension" --swift --force --no-prompt --no-open --macos-only
  while [ ! -d "$SAFARI_XCODE_PROJECT_PROD/wallet.xcodeproj" ]; do
    echo "Waiting for Xcode project creation to complete..."
    sleep 5
  done
  xcodebuild -project "$PROJECT_ROOT/safari-extension/wallet/wallet.xcodeproj" -configuration Debug build
else
  APP_ENV=production WEB_ENGINE=webkit-safari WEBPACK_BUILD_OUTPUT_PATH=safari-prod expo export:web &&
  sleep 3 &&
  xcodebuild -project "$PROJECT_ROOT/safari-extension/wallet/wallet.xcodeproj" -configuration Debug build
fi

