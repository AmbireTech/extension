import { defineConfig } from 'mobilewright'

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
        bundleId: 'com.ambire.app.wallet',
        // mobilecli installs onto a simulator from a .zip of the .app bundle.
        // CI stages the prebuilt zip here (see .github/workflows/_mobilewright-ios-suite.yml);
        // locally, drop a zip of your Debug-iphonesimulator Ambire.app at this path.
        installApps: './Ambire-sim.zip'
      }
    },
    {
      name: 'android',
      use: {
        platform: 'android',
        deviceName: /Pixel/,
        // android/app/build.gradle applicationId
        bundleId: 'com.ambire.wallet',
        installApps: './Ambire.apk'
      }
    }
  ]
})
