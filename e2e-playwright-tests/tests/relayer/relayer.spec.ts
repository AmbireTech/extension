import { baParams } from 'constants/env'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'
import { runSimpleTransferFlow } from 'flows/transferFlow'

import { expect } from '@playwright/test'

/**
 * @description mock relayer is down
 */

test.describe('Mock Relayer down', { tag: '@relayer' }, () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(baParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('top up gas tank works only when paying gas with Native token', async ({ pages }) => {
    const sendTokenUsdcOp = tokens.usdc.optimism
    const feeTokenEthOp = tokens.eth.optimism
    const errorMessage =
      'The transaction cannot be broadcast because of a Paymaster Error.\nPlease try again or contact Ambire support for assistance.'

    await test.step('block relayer route', async () => {
      await pages.stability.blockRoute('**/relayer.ambire.com/**')
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

      // approve the high impact modal if appears
      await pages.basePage.handlePriceWarningModals()

      // Sign & Broadcast
      await pages.basePage.expectButtonEnabled(selectors.signButton)
      await pages.basePage.click(selectors.signButton)
    })

    await test.step('pay gas with gastank should fail if relayer is down', async () => {
      await expect(pages.basePage.page.locator(selectors.transaction.transactionError)).toHaveText(
        errorMessage
      )

      // close modal
      await pages.basePage.click(selectors.transaction.backButton)
    })

    await test.step('set token to USDC on OP', async () => {
      await pages.auth.pause()

      await pages.basePage.clickOnMenuToken(sendTokenUsdcOp)
      await pages.basePage.page.getByTestId(selectors.flipIcon).click()

      // Switching to dollars takes a few milliseconds for the controller to update,
      // and if the amount is filled at the same time, sometimes the amount is not set in the UI or in the controller.
      await pages.basePage.page.waitForTimeout(1000)

      // Amount
      await pages.basePage.entertext(selectors.transaction.amountField, '0.0001')
      // const amountField = this.page.getByTestId(selectors.transaction.amountField)
      // await amountField.fill(amount)
    })

    await test.step('set to pay fee with ETH Native token', async () => {
      // Proceed
      await pages.auth.pause()
      await pages.basePage.expectButtonEnabled(selectors.transaction.proceedBtn)
      await pages.basePage.longPressButton(selectors.transaction.proceedBtn, 1)

      // approve the high impact modal if appears
      await pages.basePage.handlePriceWarningModals()

      // select fee token
      console.log(feeTokenEthOp)
      await pages.basePage.selectFeeToken(baParams.envSelectedAccount, feeTokenEthOp, false)

      // Sign & Broadcast
      await pages.basePage.expectButtonEnabled(selectors.signButton)
      await pages.basePage.click(selectors.signButton)
      await pages.basePage.isVisible(selectors.transaction.confirmingYourTransactionText)

      // Close page
      await pages.basePage.click(selectors.closeProgressModalButton)
    })

    await test.step('assert new transaction on Activity tab', async () => {
      await pages.gasTank.checkSendTransactionOnActivityTab()
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
