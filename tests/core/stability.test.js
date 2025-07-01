/* eslint-disable import/no-unresolved */
import { checkBalanceOfToken } from '../common-helpers/checkBalanceOfToken'
import { baParams, DEF_KEYSTORE_PASS } from '../config/constants'
import { bootstrapWithStorage } from '../common-helpers/bootstrapWithStorage'
import { clickOnElement } from '../common-helpers/clickOnElement'
import { monitorRequests } from '../common/requests'
import {
  checkTokenBalanceClickOnGivenActionInDashboard,
  makeValidTransaction
} from '../common/transactions'
import { typeKeystorePassAndUnlock } from '../common-helpers/typeKeystorePassAndUnlock'
import { buildSelector } from '../common-helpers/buildSelector'
import { SELECTORS } from '../common/selectors/selectors'

const SEND_TOKEN_SELECTOR = SELECTORS.nativeTokenBaseDashboard
const DASHBOARD_SEND_BTN_SELECTOR = SELECTORS.tokenSend

const startSWAndUnlockKeystore = async (page, extensionURL, recorder, serviceWorker) => {
  const {
    parsedKeystoreUID: keyStoreUid,
    parsedKeystoreKeys: keystoreKeys,
    parsedKeystoreSecrets: keystoreSecrets
  } = baParams

  await serviceWorker.evaluate((params) => chrome.storage.local.set(params), {
    keyStoreUid,
    keystoreKeys,
    keystoreSecrets,
    isE2EStorageSet: true
  })

  try {
    // Navigate to a specific URL if necessary
    await page.goto(`${extensionURL}/tab.html#/keystore-unlock`, { waitUntil: 'load' })

    await typeKeystorePassAndUnlock(page, DEF_KEYSTORE_PASS)
  } catch (e) {
    console.log(e)
    await recorder.stop()
    await browser.close()

    process.exit(1)
  }
}

describe("The extension works properly when crucial APIs aren't working from launch", () => {
  let browser
  let page
  let recorder
  let extensionURL
  let serviceWorker

  beforeEach(async () => {
    ;({ browser, page, recorder, extensionURL, serviceWorker } = await bootstrapWithStorage(
      'monitor_requests',
      { ...baParams, isE2EStorageSet: false },
      true
    ))
  })

  afterEach(async () => {
    await recorder.stop()
    await browser.close()
  })

  it('RPC fail: Should load and refresh portfolio with a bad Polygon RPC', async () => {
    await monitorRequests(
      serviceWorker.client,
      async () => {
        await startSWAndUnlockKeystore(page, extensionURL, recorder, serviceWorker)
        await clickOnElement(page, '[data-testid="refresh-button"]')
        await page.waitForTimeout(1000)
        await clickOnElement(page, '[data-testid="balance-affecting-error-icon')

        const rpcErrorBanner = await page.evaluate(() => {
          const errors = document.querySelectorAll('[data-testid="portfolio-error-alert"]')

          const error = Array.from(errors).find((b) =>
            b.innerText.includes('Failed to retrieve network data for Polygon')
          )

          return error ? error.innerText : ''
        })

        expect(rpcErrorBanner).toBeTruthy()
      },
      {
        blockRequests: ['invictus.ambire.com/polygon']
      }
    )
  })
  it.skip('RPC fail: Should be able to broadcast a transaction on Polygon with a bad Ethereum RPC', async () => {
    await monitorRequests(
      serviceWorker.client,
      async () => {
        await startSWAndUnlockKeystore(page, extensionURL, recorder, serviceWorker)
        await checkTokenBalanceClickOnGivenActionInDashboard(
          page,
          SEND_TOKEN_SELECTOR,
          DASHBOARD_SEND_BTN_SELECTOR
        )
        await makeValidTransaction(page, extensionURL, browser)
      },
      {
        blockRequests: ['invictus.ambire.com/ethereum']
      }
    )
  })
  it('Velcro fail: Should find tokens using previous hints; Should not display an error banner as there are cached hints', async () => {
    await monitorRequests(
      serviceWorker.client,
      async () => {
        await startSWAndUnlockKeystore(page, extensionURL, recorder, serviceWorker)

        // Tokens are found using previous hints
        // -- DAI on Arbitrum
        await checkBalanceOfToken(
          page,
          buildSelector('token-0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1-42161'),
          0
        )
        // -- USDC on Optimism
        await checkBalanceOfToken(
          page,
          buildSelector('token-0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85-10'),
          0
        )
        // -- WALLET on Ethereum
        await checkBalanceOfToken(
          page,
          buildSelector('token-0x88800092fF476844f74dC2FC427974BBee2794Ae-1'),
          0
        )

        await page.waitForTimeout(1000)

        const dashboardErrorTriangle = await page.evaluate(() => {
          return document.querySelector('[data-testid="balance-affecting-error-icon"]')
        })

        // An error banner is displayed because there are valid hints in storage while the relayer is down
        expect(dashboardErrorTriangle).not.toBeTruthy()
      },
      {
        blockRequests: ['https://relayer.ambire.com/velcro-v3']
      }
    )
  })
  // TODO: Write more tests that the relayer and maybe more RPCs
})
// TODO: Write more tests in which APIs fail mid-operation
// describe('The extension works properly when crucial APIs stop working mid-operation', () => {})
