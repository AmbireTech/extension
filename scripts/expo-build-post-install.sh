#!/bin/bash

# EAS build lifecycle hook. Android - runs once after the following commands
# have all completed: npm install and npx expo prebuild (if needed). iOS - runs
# once after the following commands have all completed: npm install,
# npx expo prebuild (if needed), and pod install.

# Copies the JS file for the web3 dapp injection mechanism
if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
  cp -rf ./src/mobile/modules/web3/services/webview-inpage/EthereumProvider.js ./android/app/src/main/assets
elif [[ "$EAS_BUILD_PLATFORM" == "ios" ]]; then
  cp ./src/mobile/modules/web3/services/webview-inpage/EthereumProvider.js ios
fi
