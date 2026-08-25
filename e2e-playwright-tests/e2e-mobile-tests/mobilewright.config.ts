import { defineConfig } from 'mobilewright'

export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  bundleId: 'com.ambire.wallet',
  timeout: 120_000,
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
        installApps: ''
      }
    },
    {
      name: 'android',
      use: { platform: 'android', deviceName: /Pixel/, installApps: './Ambire.apk' }
    }
  ]
})
