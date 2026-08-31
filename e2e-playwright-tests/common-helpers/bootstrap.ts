import { KEYSTORE_PASS } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'
import path from 'path'

import { BrowserContext, chromium, Page } from '@playwright/test'

// const buildPath = `build/${process.env.WEBPACK_BUILD_OUTPUT_PATH || 'webkit-prod'}`
/**
 * bootstrap file for the extension build
 */

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const BUILD_SUBDIR = process.env.WEBPACK_BUILD_OUTPUT_PATH || ''
const EXTENSION_PATH =
  process.env.E2E_EXTENSION_PATH || path.resolve(REPO_ROOT, 'build', BUILD_SUBDIR)

/** Empty string - Playwright creates a fresh temp profile per launch. */
const USER_DATA_DIR = ''

/** How long to wait for the extension to open its own onboarding tab. */
const EXTENSION_TAB_TIMEOUT = 6000

const DEFAULT_TIMEOUT = 120000

let currentContext: BrowserContext | null = null

const playwrightArgs = [
  `--disable-extensions-except=${EXTENSION_PATH}`,
  `--load-extension=${EXTENSION_PATH}`,
  '--disable-features=DialMediaRouteProvider,LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests',
  '--clipboard-write=granted',
  '--clipboard-read=prompt',
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

// ---------------------------------------------------------------------------
// Browser launch
// ---------------------------------------------------------------------------

/**
 * Launches the persistent context with the extension loaded and waits for the
 * extension's service worker to come up. Does NOT create a page
 * the extension opens its own onboarding tab on install
 */

async function launchBrowser(): Promise<{
  context: BrowserContext
  serviceWorker: any
  extensionURL: string
}> {
  if (currentContext) {
    try {
      await currentContext.close()
    } catch (err) {
      console.warn('Failed to close previous context:', err)
    }
    currentContext = null
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    channel: 'chromium',
    slowMo: 10,
    ignoreHTTPSErrors: true,
    args: playwrightArgs,
    viewport: null
  })

  currentContext = context

  // Default timeout applies to every page in context, including tabs opened later
  // (the block explorer tab, dapp popups, etc.)
  context.setDefaultTimeout(DEFAULT_TIMEOUT)

  let serviceWorker

  for (let i = 0; i < 50; i += 1) {
    serviceWorker = context
      .serviceWorkers()
      .find((sw) => sw.url().startsWith('chrome-extension://'))
    if (serviceWorker) break
    await new Promise((res) => {
      setTimeout(res, 100)
    })
  }

  if (!serviceWorker) {
    throw new Error('❌ Extension service worker not found after waiting')
  }

  try {
    serviceWorker.on('console', (msg) => {
      console.log(`[service-worker] ${msg.text()}`)
    })
  } catch (err) {
    console.warn('Console logging for service worker not available:', err)
  }

  const extensionId = serviceWorker.url().split('/')[2]
  const extensionURL = `chrome-extension://${extensionId}`

  return { context, serviceWorker, extensionURL }
}

// ---------------------------------------------------------------------------
// Tab management
// ---------------------------------------------------------------------------

/**
 * Closes any onboarding tab the extension opens AFTER bootstrap finished
 * for example due to slow service worker. Only get-started tabs (duplicate) that
 * could open after initial tab will be closed
 * The initial issue was another get-started page being opened
 * causing flakiness in trezor test
 *
 * Returns a function that removes the listener.
 */
export function removeDuplicateOnboardingTabsIfAny(
  context: BrowserContext,
  keep: Page
): () => void {
  const handler = async (tab: Page) => {
    if (tab === keep || tab.isClosed()) return

    try {
      await tab.waitForURL((u) => u.href.includes('get-started'), { timeout: 3000 })
    } catch {
      return
    }

    await tab.close().catch(() => {})
  }

  context.on('page', handler)

  return () => context.off('page', handler)
}

/**
 * Takes over the tab the extension opens on install instead of racing it.
 *
 * On a cold profile (which is every run, since USER_DATA_DIR is '') the
 * extension's `onInstalled` handler calls `chrome.tabs.create` a second or two
 * after launch. We wait for that tab, close the blank tab Chrome created at
 * launch, and end up with exactly one page. If the tab never appears we fall
 * back to driving a page ourselves.
 */
async function acquireExtensionPage(
  context: BrowserContext,
  extensionURL: string,
  targetUrl: string,
  timeout = EXTENSION_TAB_TIMEOUT
): Promise<Page> {
  const isExtensionTab = (url: string) => url.startsWith(extensionURL)

  let page = context.pages().find((p) => !p.isClosed() && isExtensionTab(p.url()))

  if (!page) {
    const deadline = Date.now() + timeout // additional tab takes couple of seconds to open

    while (!page && Date.now() < deadline) {
      try {
        const tab = await context.waitForEvent('page', {
          timeout: Math.max(deadline - Date.now(), 1)
        })
        await tab.waitForURL((u) => isExtensionTab(u.href), { timeout: 3000 })
        page = tab
      } catch {
        // not an extension tab (or nothing opened) — keep waiting until deadline
      }
    }
  }

  page = page ?? context.pages()[0] ?? (await context.newPage())

  // Exactly one tab from here on.
  await Promise.all(
    context
      .pages()
      .filter((p) => p !== page && !p.isClosed())
      .map((p) => p.close().catch(() => {}))
  )

  removeDuplicateOnboardingTabsIfAny(context, page)

  await page.goto(targetUrl, { waitUntil: 'load' })

  return page
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/** Waits until chrome.storage.local is reachable from the service worker. */
async function waitForStorage(serviceWorker: any): Promise<void> {
  const maxAttempts = 50

  for (let i = 0; i < maxAttempts; i += 1) {
    const isReady = await serviceWorker.evaluate(
      () => typeof chrome !== 'undefined' && !!chrome.storage?.local
    )

    if (isReady) return

    await new Promise((res) => {
      setTimeout(res, 100)
    })
  }

  throw new Error('❌ chrome.storage.local was never available in service worker')
}

// ---------------------------------------------------------------------------
// Bootstraps
// ---------------------------------------------------------------------------

/**
 * Bootstraps the extension with no pre-seeded account storage — lands on
 * the get-started screen.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function bootstrap(namespace: string) {
  const { context, serviceWorker, extensionURL } = await launchBrowser()

  // Seed before acquiring the page: if the extension checks storage before
  // opening its onboarding tab, it may skip opening one at all.
  await waitForStorage(serviceWorker)
  await serviceWorker.evaluate(() => chrome.storage.local.set({ isE2EStorageSet: true }))

  const page = await acquireExtensionPage(
    context,
    extensionURL,
    `${extensionURL}${mainConstants.urls.getStarted}`
  )

  return { page, context, extensionURL, serviceWorker }
}

/**
 * Bootstraps the extension with pre-seeded storage.
 *
 * @param namespace - kept for call-site compatibility; currently unused.
 * @param storageParams - parsed keystore/account fixtures to write into
 * chrome.storage.local before the UI mounts.
 * @param shouldUnlockKeystoreManually - when true, the keystore unlock is left
 * to the test.
 */
export async function bootstrapWithStorage(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  namespace: string,
  storageParams: any,
  shouldUnlockKeystoreManually = false
) {
  const { context, serviceWorker, extensionURL } = await launchBrowser()

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
    ...(!shouldUnlockKeystoreManually && {
      keyStoreUid,
      keystoreKeys,
      keystoreSecrets
    }),
    ...rest
  }

  // Seed storage before the UI mounts, so the extension sees a completed setup
  // and (ideally) never opens the onboarding tab.
  await waitForStorage(serviceWorker)
  await serviceWorker.evaluate((params) => chrome.storage.local.set(params), storageParamsMapped)

  // '/keystore-unlock' omitted on purpose — it redirects to /keystore-setup.
  const page = await acquireExtensionPage(context, extensionURL, `${extensionURL}/tab.html#/`)

  if (!shouldUnlockKeystoreManually) {
    // Let failures throw: Playwright's fixture teardown closes the context, and
    // the trace/report is preserved. The old `process.exit(1)` here was Jest-era
    // advice — under Playwright it kills the whole worker and takes unrelated
    // tests down with it.
    await page.getByTestId(selectors.passphraseField).fill(KEYSTORE_PASS)
    await page.getByTestId(selectors.buttonUnlock).click()
  }

  return { page, context, serviceWorker, extensionURL }
}
