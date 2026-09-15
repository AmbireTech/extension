#!/bin/sh
# Boots the local iOS simulator and/or Android emulator used to run the mobilewright
# suite, without running xCodue Simulator.app or Android Studio. Device names match the
# patterns in mobilewright.config.ts (deviceName: /iPhone/, /Pixel/), so anything
# booted here is picked up automatically — no config changes needed.
#
# Usage:
#   ./scripts/boot-devices.sh [ios|android|all]   (default: all)
set -e

IOS_DEVICE_NAME="${IOS_DEVICE_NAME:-iPhone 17 Pro}"
ANDROID_AVD="${ANDROID_AVD:-Pixel_10a}"
ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

boot_ios() {
  if xcrun simctl list devices booted | grep -q "$IOS_DEVICE_NAME ("; then
    echo "iOS: \"$IOS_DEVICE_NAME\" already booted"
  else
    echo "iOS: booting \"$IOS_DEVICE_NAME\" (headless)"
    xcrun simctl boot "$IOS_DEVICE_NAME"
  fi
  # Waits until fully settled, not just "Booted" — a device can report Booted while
  # SpringBoard/BackBoard are still starting up, which is what caused earlier flakiness.
  xcrun simctl bootstatus "$IOS_DEVICE_NAME"
  echo "iOS: ready"
}

boot_android() {
  adb_bin="$ANDROID_HOME/platform-tools/adb"
  emulator_bin="$ANDROID_HOME/emulator/emulator"

  if [ ! -x "$adb_bin" ] || [ ! -x "$emulator_bin" ]; then
    echo "Android: adb/emulator not found under \$ANDROID_HOME ($ANDROID_HOME). Set ANDROID_HOME and retry." >&2
    exit 1
  fi

  if "$adb_bin" devices | grep -q "^emulator-.*device$"; then
    echo "Android: emulator already running"
  else
    echo "Android: booting \"$ANDROID_AVD\" (headless)"
    "$emulator_bin" -avd "$ANDROID_AVD" -no-window -no-audio -no-boot-anim &
    "$adb_bin" wait-for-device
    until [ "$("$adb_bin" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
      sleep 2
    done
  fi
  echo "Android: ready"
}

case "${1:-all}" in
  ios)
    boot_ios
    ;;
  android)
    boot_android
    ;;
  all)
    boot_ios
    boot_android
    ;;
  *)
    echo "Usage: $0 [ios|android|all]" >&2
    exit 1
    ;;
esac
