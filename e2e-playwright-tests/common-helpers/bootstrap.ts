import { KEYSTORE_PASS } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'

import path from 'path'

import { BrowserContext, chromium, Page } from '@playwright/test'

// Mirrors the build output resolution of webpack/env.js, so the tests pick up the
// extension even when BUILD_DIR moves the builds outside of the repo.
const buildDir = process.env.BUILD_DIR || path.resolve(__dirname, '../../build')
const extensionPath = path.join(buildDir, process.env.WEBPACK_BUILD_OUTPUT_PATH || 'webkit-prod')
const USER_DATA_DIR = '' // you can set a temp dir if needed
const DEFAULT_SLOW_MO = 10

// Launching a persistent context ignores `use.headless` from the config, so watching a run
// locally is opted into here instead
const isHeaded = process.env.PLAYWRIGHT_HEADED === 'true'
const slowMoFromEnv = process.env.PLAYWRIGHT_SLOW_MO
  ? Number.parseInt(process.env.PLAYWRIGHT_SLOW_MO, 10)
  : NaN
const slowMo = Number.isFinite(slowMoFromEnv) ? slowMoFromEnv : DEFAULT_SLOW_MO

let currentContext: BrowserContext | null = null

// Storage flags that hide one-time UI announcements (e.g. the CoW Swap card on Swap & Bridge),
// so they don't cover the elements the tests interact with
const DISMISSED_ANNOUNCEMENTS_STORAGE = {
  cowSwapAnnouncementDismissed: true
}

// Disables CoW Swap in Swap & Bridge, while keeping every other swap provider enabled
const SWAP_PROVIDERS_STORAGE = {
  disabledSwapProviderIds: JSON.stringify(['cowswap'])
}

const playwrightArgs = [
  `--disable-extensions-except=${extensionPath}/`,
  `--load-extension=${extensionPath}/`,
  '--disable-features=DialMediaRouteProvider,LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests',
  '--clipboard-write=granted',
  '--clipboard-read=prompt',
  '--detectOpenHandles',
  '--start-maximized',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--font-render-hinting=none',
  '--ignore-certificate-errors',
  '--window-size=1920,1080',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-software-rasterizer',
  '--disable-accelerated-2d-canvas',
  '--disable-gl-drawing-for-tests',
  '--use-gl=swiftshader',
  '--ip-address-space-overrides=127.0.0.1:0=public'
]

/**
 * Launches the persistent context with the extension loaded and waits for the
 * extension's service worker to come up and returns a fresh page.
 */

async function initBrowser(namespace: string): Promise<{
  page: Page
  extensionURL: string
  serviceWorker: any
  context: BrowserContext
}> {
  // Close any previously opened context before creating a new one
  if (currentContext) {
    try {
      await currentContext.close()
    } catch (err) {
      console.warn('Failed to close previous context:', err)
    }
    currentContext = null
  }

  // 1. Launch persistent context with extension
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    channel: 'chromium',
    headless: !isHeaded,
    slowMo,
    ignoreHTTPSErrors: true,
    args: playwrightArgs,
    env: process.env.DISPLAY ? { DISPLAY: process.env.DISPLAY } : undefined,
    viewport: null
  })

  currentContext = context

  if (!context) {
    throw new Error('Failed to create persistent browser context')
  }

  // 2. Wait for service worker to load
  let serviceWorker
  for (let i = 0; i < 50; i++) {
    serviceWorker = context
      .serviceWorkers()
      .find((sw) => sw.url().startsWith('chrome-extension://'))
    if (serviceWorker) break
    // eslint-disable-next-line no-await-in-loop
    await new Promise((res) => setTimeout(res, 100))
  }

  if (!serviceWorker) {
    throw new Error('❌ Extension service worker not found after waiting')
  }

  const extensionId = serviceWorker.url().split('/')[2]
  const extensionURL = `chrome-extension://${extensionId}`

  // 3. Take over the extension's own tab instead of opening another one
  // const page = await acquireExtensionPage(context, extensionURL)
  const page = await context.newPage()
  page.setDefaultTimeout(120000)

  await Promise.all(
    context
      .pages()
      .filter((p) => p !== page && !p.isClosed())
      .map((p) => p.close().catch(() => { }))
  )

  // 4. Attach console logging from service worker; could make debugging easier
  try {
    serviceWorker.on('console', (msg) => {
      console.log(`[service-worker] ${msg.text()}`)
    })
  } catch (err) {
    console.warn('Console logging for service worker not available:', err)
  }

  return { page, extensionURL, serviceWorker, context }
}

// Wait until chrome.storage.local becomes available
async function waitForStorage(serviceWorker) {
  const maxAttempts = 50

  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < maxAttempts; i++) {
    const isReady = await serviceWorker.evaluate(() => {
      return typeof chrome !== 'undefined' && !!chrome.storage?.local
    })

    if (isReady) {
      return
    }

    await new Promise((res) => {
      setTimeout(res, 100)
    })
  }
  /* eslint-enable no-await-in-loop */

  throw new Error('❌ chrome.storage.local was never available in service worker')
}

//----------------------------------------------------------------------------------------------
export async function bootstrap(namespace: string) {
  const { page, context, extensionURL, serviceWorker } = await initBrowser(namespace)
  await page.goto(`${extensionURL}${mainConstants.urls.getStarted}`, { waitUntil: 'load' })

  await waitForStorage(serviceWorker)

  await serviceWorker.evaluate((params) => chrome.storage.local.set(params), {
    isE2EStorageSet: true,
    ...DISMISSED_ANNOUNCEMENTS_STORAGE,
    ...SWAP_PROVIDERS_STORAGE
  })
  return { page, context, extensionURL }
}

//----------------------------------------------------------------------------------------------
/**
 * Bootstraps the application with storage settings.
 *
 * @param {string} namespace - The namespace to be used.
 * @param {Object} storageParams - Parameters to configure storage.
 * @param {boolean} [shouldUnlockKeystoreManually=false] - If true, the keystore must be unlocked manually.
 *
 * @returns {Promise<void>} - A promise that resolves once the operation completes.
 */
export async function bootstrapWithStorage(
  namespace,
  storageParams,
  shouldUnlockKeystoreManually = false
) {
  // Initialize browser and page using bootstrap
  const { page, extensionURL, serviceWorker, context } = await initBrowser(namespace)

  const {
    parsedKeystoreAccounts: accounts,
    parsedLearnedAssets: learnedAssets,
    envSelectedAccount: selectedAccount,
    parsedKeystoreUID: keyStoreUid,
    parsedKeystoreKeys: keystoreKeys,
    parsedKeystoreSecrets: keystoreSecrets,
    parsedKeystoreSeeds: keystoreSeeds,
    ...rest
  } = storageParams

  const storageParamsMapped = {
    accounts,
    learnedAssets,
    selectedAccount,
    isE2EStorageSet: true,
    isSetupComplete: 'true',
    ...DISMISSED_ANNOUNCEMENTS_STORAGE,
    ...SWAP_PROVIDERS_STORAGE,
    ...(!shouldUnlockKeystoreManually && {
      keyStoreUid,
      keystoreKeys,
      keystoreSecrets
    }),
    ...rest
  }

  await waitForStorage(serviceWorker)

  await serviceWorker.evaluate((params) => chrome.storage.local.set(params), storageParamsMapped)

  /**
   * If something goes wrong with any of the functions below, e.g., `typeSeedPhrase`,
   * this `bootstrapWithStorage` won't return the expected object (browser, recorder, etc.),
   * and the CI will hang for a long time as the recorder won't be stopped in the `afterEach` block and will continue recording.
   */
  if (!shouldUnlockKeystoreManually) {
    try {
      // Navigate to a specific URL if necessary
      await page.goto(`${extensionURL}/tab.html#/`, { waitUntil: 'load' }) // removed '/keystore-unlock' because of wrong redirection to /keystore-setup

      await page.getByTestId(selectors.passphraseField).fill(KEYSTORE_PASS)
      await page.getByTestId(selectors.buttonUnlock).click()
    } catch (e) {
      console.log(e)
      process.exit(1)
    }
  }

  return { page, context, serviceWorker, extensionURL }
}