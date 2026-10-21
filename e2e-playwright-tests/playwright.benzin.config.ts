import { PlaywrightTestConfig } from '@playwright/test'

import baseConfig from './playwright.config'

const BENZIN_PORT = 4173
const BENZIN_URL = `http://localhost:${BENZIN_PORT}`

/** Runs the benzin specs against the production build in `build/benzin-prod`. */
const config: PlaywrightTestConfig = {
  ...baseConfig,
  testDir: 'tests/benzin',
  testIgnore: undefined,
  use: { ...baseConfig.use, baseURL: BENZIN_URL },
  webServer: {
    command: `python3 -m http.server ${BENZIN_PORT} --directory ../build/benzin-prod`,
    url: BENZIN_URL,
    reuseExistingServer: !process.env.CI
  }
}

export default config
