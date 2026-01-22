import 'dotenv/config'

import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  forbidOnly: true,
  expect: {
    timeout: 30 * 1000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 1 / 100
    }
  },
  testDir: 'tests/stability',
  testMatch: '**/*.spec.ts',
  reporter: [['list'], ['html', { outputFolder: 'html-report', open: 'never' }]],
  timeout: 180 * 1000, // 3min
  reportSlowTests: null,
  snapshotPathTemplate: 'data/screenshots/{projectName}/{testFilePath}/{arg}/text',
  retries: process.env.CI ? 3 : 0,
  workers: process.env.CI ? 3 : 3,
  fullyParallel: true,
  use: {
    viewport: { width: 1920, height: 1080 },
    baseURL: process.env.APP_URL || '',
    headless: true,
    trace: 'on-first-retry',
    /**
     * We are starting the extension with `chromium.launchPersistentContext`,
     * not the default Playwright way, because of the extension setup.
     *
     * Because of this, whatever we pass to `video`, it simply doesn't work,
     * because our newly created context is not the default one.
     *
     * The workaround is to pass `recordVideo: { dir: 'test-results/videos' }`
     * to `chromium.launchPersistentContext`, but then all tests are being recorded,
     * not only the failed ones.
     *
     * There could be ways for fixing it, but for now the traces we have (html-report),
     * is perfectly fine for debugging, because we can simply load in in the local Playwright
     * with `npx playwright show-report` and in seconds we can see the real test failura reason.
     *
     */
    video: 'off',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    launchOptions: {
      downloadsPath: 'test-results/downloads/'
    },
    actionTimeout: 60 * 1000,
    navigationTimeout: 45 * 1000,
    permissions: ['clipboard-read', 'clipboard-write']
  }
}

export default config
