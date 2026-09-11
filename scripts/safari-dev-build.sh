#!/bin/bash

SCRIPTS_DIR="$(dirname "$(realpath "$0")")"
PROJECT_ROOT="$(cd "$SCRIPTS_DIR"; while [ ! -f "README.md" ] && [ "$PWD" != "/" ]; do cd ..; done; pwd)"
# The folder that holds the build outputs, honouring the optional BUILD_DIR env
BUILD_DIR="$(cd "$PROJECT_ROOT" && node -p "require('./webpack/env').buildDir")"
SAFARI_DEV_DIR="$BUILD_DIR/safari-dev"
SAFARI_XCODE_PROJECT="$PROJECT_ROOT/safari-extension/wallet-dev"
INDEX="$SAFARI_DEV_DIR/index.html"
BACKGROUND="$SAFARI_DEV_DIR/background.js"
EXPO_DEV_PORT=19000


cleanup() {
  pkill -P $$
  exit 0
}

trap cleanup SIGINT

rm -rf "$SAFARI_DEV_DIR"
rm -rf ./safari-extension/wallet-dev
mkdir ./safari-extension/wallet-dev
chmod 777 ./safari-extension/wallet-dev

WEB_ENGINE=webkit-safari WEBPACK_BUILD_OUTPUT_PATH=safari-dev APP_ENV=development expo start --web &

while [ ! -d "$SAFARI_DEV_DIR" ] || [ ! -f "$INDEX" ] || [ ! -f "$BACKGROUND" ]; do
    echo "Waiting for safari-dev build to complete..."
    sleep 5
done

if [ -d "$SAFARI_DEV_DIR" ] && [ -f "$INDEX" ] && [ -f "$BACKGROUND" ]; then
  sleep 5

  yes | xcrun -v "/Applications/Xcode.app/Contents/Developer/usr/bin/safari-web-extension-converter" "$SAFARI_DEV_DIR" --app-name wallet-dev --project-location $PROJECT_ROOT/safari-extension --swift --force --no-prompt --no-open --macos-only --bundle-identifier com.ambire.app.wallet.extension

  while [ ! -d "$SAFARI_XCODE_PROJECT/wallet-dev.xcodeproj" ]; do
    echo "Waiting for Xcode project creation to complete..."
    sleep 5
  done

  xcodebuild -project "$PROJECT_ROOT/safari-extension/wallet-dev/wallet-dev.xcodeproj" -configuration Debug build
  fswatch -o "$SAFARI_DEV_DIR" | while read; do
    echo "Changes detected. Rebuilding Xcode project..."
    xcodebuild -project "$PROJECT_ROOT/safari-extension/wallet-dev/wallet-dev.xcodeproj" -configuration Debug build
  done
fi

# Infinite loop to keep the script running
while true; do
  sleep 10  # Sleep for 10 second in each iteration to reduce CPU usage
done
