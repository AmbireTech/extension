import { saParams } from 'constants/env'
import fetch from 'node-fetch'

import { expect } from '@playwright/test'

import selectors from '../../constants/selectors'
import tokens from '../../constants/tokens'
import { test } from '../../fixtures/pageObjects'

test.describe('stability', { tag: '@stability' }, () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(saParams, { shouldUnlockManually: true })
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('RPC fail: Should load and refresh portfolio with a bad Polygon RPC', async ({ pages }) => {
    await test.step('block Polygon RPC requests', async () => {
      await pages.stability.blockRouteAndUnlock('**/invictus.ambire.com/polygon')
    })

    await test.step('click on the error indicator and appropriate message is expected to be shown', async () => {
      const page = pages.stability.page
      await page.getByTestId(selectors.dashboard.balanceErrorIcon).click()

      const rpcErrorBanner = page.getByTestId(selectors.dashboard.portfolioErrorAlert).first()

      await expect(rpcErrorBanner).toBeVisible()
      await expect(rpcErrorBanner).toContainText('Failed to retrieve network data for Polygon')
    })
  })

  test('Velcro fail: Should find tokens using previous hints; Should not display an error banner as there are cached hints', async ({
    pages
  }) => {
    const page = pages.stability.page

    await test.step('block Velcro tokens request and unlock the extension', async () => {
      await pages.stability.blockRouteAndUnlock('**/relayer.ambire.com/velcro-v3/*')
    })

    await test.step('tokens are found using previous hints', async () => {
      const daiToken = pages.stability.getDashboardTokenSelector(tokens.dai.arbitrum)
      await expect(daiToken).toBeVisible()

      const usdcToken = pages.stability.getDashboardTokenSelector(tokens.usdc.optimism)
      await expect(usdcToken).toBeVisible()

      const walletToken = pages.stability.getDashboardTokenSelector(tokens.wallet.ethereum)
      await expect(walletToken).toBeVisible()
    })

    await test.step('click on the error indicator and appropriate message is expected to be shown', async () => {
      await page.getByTestId(selectors.dashboard.balanceErrorIcon).click()
      const velcroErrorBanner = page.getByTestId(selectors.dashboard.portfolioErrorAlert)

      await expect(velcroErrorBanner).toBeVisible()
      await expect(velcroErrorBanner).toContainText(
        'Automatic asset discovery is temporarily unavailable'
      )
    })
  })

  test('Monitor fetch requests on Dashboard', async ({ pages }) => {
    const page = pages.stability.page

    await test.step('start monitoring requests and unlock the extension', async () => {
      await pages.stability.monitorRequests()
      await pages.stability.unlock()
    })

    await test.step('wait for the dashboard to fully load and validate the requests being made', async () => {
      // Wait for all requests to be triggered
      await page.waitForTimeout(10000)

      const categorized = pages.stability.getCategorizedRequests()

      // ⚠️ Note: It's difficult to accurately track the exact number of requests being made,
      // as even minor changes (e.g. adding a new default network, cache misses, retries) can shift totals.
      // The expectations below are based on rough estimates and include some tolerance.
      // If any of them are exceeded significantly, it may signal a regression.
      // ---
      // Note on RPC requests:
      // Each network typically triggers 2 RPC calls.
      // So the total number of RPC requests scales linearly with the number of networks configured.
      // This is why the threshold here is intentionally higher to account for all supported networks.
      expect(categorized.rpc.length).toBeLessThanOrEqual(30)
      expect(categorized.hints.length).toBeLessThanOrEqual(1)
      expect(categorized.nativePrices.length).toBeLessThanOrEqual(10)
      expect(categorized.thirdParty.length).toBeLessThanOrEqual(10)
      expect(categorized.allowedUncategorized.length).toBeLessThanOrEqual(10)

      // ☢️ Critical: there should be no truly uncategorized requests.
      // Anything uncategorized is likely unexpected or suspicious.
      expect(categorized.uncategorized.length).toBeLessThanOrEqual(0)
    })
  })

  // We had a performance regression where 2001 fallback hints were returned for the BNB chain (hasHints=false).
  // This caused the extension to check the token balance for every single asset, leading to performance issues.
  // Now we limit fallback hints to 201, and allow up to 2001 hints only when the address's assets can be determined.
  test('Ensure Velcro Multi-hints stay within asset limits to avoid performance issues', async () => {
    // vitalik.eth
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

    const chains = [
      1, // Ethereum
      10, // Optimism
      56, // BNB Chain
      137, // Polygon
      5000, // Mantle
      8453, // Base
      42161, // Arbitrum
      43114, // Avalanche
      534352, // Scroll
      100, // Gnosis
      130, // Unichain
      146, // Sonic
      204, // opBNB
      480, // World Chain
      999, // Zora
      42220, // Celo
      48900, // Zircuit
      57073, // Ink
      59144, // Linea
      80094, // Berachain
      81457 // Blast
    ]

    const url = 'https://relayer.ambire.com/velcro-v3/multi-hints'
    const networksParam = chains.join()
    const accountsParam = Array(chains.length).fill(address).join()

    const route = `${url}?networks=${networksParam}&accounts=${accountsParam}&baseCurrency=usd`

    const res = await fetch(route)
    expect(res.ok).toBe(true)

    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(chains.length)

    data.forEach((item, idx) => {
      const { chainId, erc20s, hasHints } = item || {}
      expect(Number(chainId)).toBe(chains[idx])

      // Networks with hints are limited to 2001, while others fall back to a hardcoded list of 201 hints
      const limit = hasHints ? 2001 : 201
      expect(Array.isArray(erc20s)).toBe(true)

      // Fail message will include chainId and hasHints context
      expect(
        erc20s.length,
        `erc20s length exceeded: chainId=${chainId}, hasHints=${hasHints}, length=${erc20s.length}, limit=${limit}`
      ).toBeLessThanOrEqual(limit)
    })
  })
})
