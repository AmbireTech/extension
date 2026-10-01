import { join } from 'path'

import { defineConfig } from 'mobilewright'

// installApps must resolve regardless of the directory the CLI is invoked from —
// resolve relative to this config file's own directory, not the process's cwd.
// Exported so specs needing the same path (e.g. auth.spec.ts's mid-test reinstall)
// share this one source of truth instead of re-hardcoding a relative string.
const CONFIG_DIR = __dirname
export const IOS_SIM_ZIP = join(CONFIG_DIR, 'Ambire-sim.zip')
export const ANDROID_APK = join(CONFIG_DIR, 'Ambire.apk')

export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  timeout: 180_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : 1,
  use: {
    appLaunchTimeout: 60_000,
    actionTimeout: 30_000,
    installTimeout: 120_000,
    animations: 'off'
  },
  expect: {
    timeout: 30_000
  },
  reporter: 'html',
  viewTree: 'on-failure',
  projects: [
    {
      name: 'ios',
      use: {
        platform: 'ios',
        deviceName: /iPhone/,
        // iOS's bundle id (ios/Ambire.xcodeproj PRODUCT_BUNDLE_IDENTIFIER / app.json
        // bundleIdentifier) differs from Android's applicationId below — don't share one
        // bundleId across both projects, launching the wrong id fails simctl with exit 4.
        bundleId: 'com.ambire.app.wallet',
        // mobilecli installs onto a simulator from a .zip of the .app bundle.
        // CI stages the prebuilt zip here (see .github/workflows/e2e-mobilewright-ios.yml's
        // "Stage iOS build" step); locally, drop a zip of your Release-iphonesimulator
        // Ambire.app at this path (see package.json's build:ios:simulator script).
        installApps: IOS_SIM_ZIP
      }
    },
    {
      name: 'android',
      use: {
        platform: 'android',
        deviceName: /Pixel/,
        // android/app/build.gradle applicationId
        bundleId: 'com.ambire.wallet',
        installApps: ANDROID_APK
      }
    }
  ]
})
