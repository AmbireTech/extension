import { saParams } from 'constants/env'
import mainConstants from 'constants/mainConstants'

import { expect, test } from '@playwright/test'

import { bootstrapWithStorage } from '../../common-helpers/bootstrap'

/**
 * Regression guard for the extension UI bundle size.
 *
 * The popup/tab UI is meant to be a thin client that talks to the background service worker and
 * renders serialized controller state. Business logic (controllers) and their heavy dependencies
 * - most notably the humanizer and its multi-megabyte address dataset, the hardware-wallet SDKs,
 * etc. must NOT be eagerly bundled into the UI.
 *
 * This test opens the dashboard as an already-set-up, unlocked user (the common case) and sums
 * the JavaScript actually downloaded on load. It intentionally does not measure get-started,
 * since that route now deliberately bundles heavier onboarding-only screens (Ledger/QR).
 *
 * If this fails, do NOT just bump the budget - first check whether background-only code leaked
 * into the UI (see the import-type eslint rule). Only raise the budget for a
 * deliberate, understood increase.
 */

const EAGER_JS_BUDGET_BYTES = 8 * 1024 * 1024

test.describe('performance: UI bundle size', { tag: '@performance' }, () => {
  test.setTimeout(120000)

  test('the UI does not eagerly download more than the JS budget on load', async () => {
    // Sets up an unlocked account on its own page first, so the onboarding/unlock JS it
    // downloads isn't counted below - we only care about the dashboard's own cost.
    const {
      context,
      extensionURL,
      page: setupPage
    } = await bootstrapWithStorage('eager-bundle-size', saParams)
    await setupPage.close()

    const jsBytesByUrl = new Map<string, number>()

    // Fresh page so we capture every script request from the very first navigation to the
    // dashboard, not whatever the setup/unlock flow above already downloaded.
    const page = await context.newPage()
    page.on('response', async (response) => {
      const url = response.url()
      if (!url.endsWith('.js')) return
      try {
        const body = await response.body()
        // Keyed by url so a chunk fetched more than once is not double-counted here - but a real
        // duplicate-download regression still shows up in a network trace and, if chunks differ,
        // in the total. We assert on unique bytes to keep the budget stable and meaningful.
        jsBytesByUrl.set(url, body.length)
      } catch {
        // Some responses (e.g. redirects) have no retrievable body; ignore them.
      }
    })

    await page.goto(`${extensionURL}${mainConstants.urls.dashboard}`, { waitUntil: 'load' })
    // Let any deferred/entry scripts finish loading before measuring.
    await page.waitForTimeout(3000)

    const entries = [...jsBytesByUrl.entries()].sort((a, b) => b[1] - a[1])
    const totalBytes = entries.reduce((sum, [, bytes]) => sum + bytes, 0)

    const breakdown = entries
      .slice(0, 10)
      .map(([url, bytes]) => `  ${(bytes / 1024 / 1024).toFixed(2)}MB  ${url.split('/').pop()}`)
      .join('\n')

    await context.close()

    expect(
      totalBytes,
      `Eager UI JS is ${(totalBytes / 1024 / 1024).toFixed(2)}MB, over the ${(
        EAGER_JS_BUDGET_BYTES /
        1024 /
        1024
      ).toFixed(
        0
      )}MB budget. Likely background-only code (a controller/humanizer/heavy lib) leaked into the UI bundle - check for a missing \`import type\`. Largest chunks:\n${breakdown}`
    ).toBeLessThan(EAGER_JS_BUDGET_BYTES)
  })
})
