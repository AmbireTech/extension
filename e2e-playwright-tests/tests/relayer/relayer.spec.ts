import { baParams, SA_ADDRESS, saParams } from 'constants/env'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'
import { runSimpleTransferFlow } from 'flows/transferFlow'

import { expect } from '@playwright/test'

/**
 * @description mock relayer is down
 */

// export const test = base.extend<{
//   relayerDown: void
// }>({
//   relayerDown: async ({ context }, use) => {
//     await context.route('**/relayer.ambire.com/**', async (route) => {
//       console.log('MOCK RELAYER DOWN - Blocking relayer request: ', route.request().url())
//       await route.abort('failed')
//     })

//     // await context.route('**/relayer.ambire.com/**', (route) =>
//     //   route.fulfill({
//     //     status: 500,
//     //     contentType: 'application/json',
//     //     body: JSON.stringify({ error: 'Relayer unavailable' })
//     //   })
//     // )

//     await use()

//     await context.unroute('**/relayer.ambire.com/**')
//   }
// })

// export const test = base.extend<{ relayerDown: { active: true } }>({
//   relayerDown: async ({ context }, use) => {
//     await context.route('**/relayer.ambire.com/**', (route) => {
//       console.log('Relayer intercept hit:', route.request().url())
//       route.abort('failed')
//     })
//     await use({ active: true }) // pass a value to the test
//     // await context.unroute('**/relayer.ambire.com/**')
//   }
// })

test.describe('Mock Relayer down', { tag: '@relayer' }, () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(saParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('top up gas tank when relayer is down', async ({ pages }) => {
    const sendTokenBase = tokens.usdc.base
    const errorMessage =
      'The transaction cannot be broadcast because of a Paymaster Error.\nPlease try again or contact Ambire support for assistance.'

    await test.step('block relayer route', async () => {
      await pages.stability.blockRoute('**/relayer.ambire.com/**')
      await pages.basePage.pause()
    })

    await test.step('assert no transaction on Activity tab', async () => {
      await pages.dashboard.checkNoTransactionOnActivityTab()
    })

    await test.step('top up with USDC on base', async () => {
      // await pages.auth.pause()
      await pages.basePage.click(selectors.dashboardGasTankBalance)
      await pages.basePage.click(selectors.topUpButton)
      await pages.basePage.entertext(selectors.transaction.amountField, '0.00001')
    })

    await test.step('pay fee with gas tank should return error', async () => {
      // Proceed
      await pages.basePage.expectButtonEnabled(selectors.transaction.proceedBtn)
      await pages.basePage.longPressButton(selectors.transaction.proceedBtn, 5)
      // Sign & Broadcast
      await pages.basePage.expectButtonEnabled(selectors.signButton)
      await pages.basePage.click(selectors.signButton)
    })

    await test.step('pay gas with gastank should fail if relayer is down', async () => {
      await expect(pages.basePage.page.locator(selectors.transaction.transactionError)).toHaveText(
        errorMessage
      )
    })

    await test.step('pay gas with native should succeed even if relayer is down', async () => {
      // await pages.auth.pause()

      // await runSimpleTransferFlow({
      //   pages,
      //   sendToken: tokens.wallet.arbitrum,
      //   recipientAddress: SA_ADDRESS,
      //   feeToken: tokens.usdc.ethereum,
      //   payWithGasTank: true,
      //   message: 'Transfer done!',
      //   assertNoInitialTx: true
      // })
    })
  })
})
