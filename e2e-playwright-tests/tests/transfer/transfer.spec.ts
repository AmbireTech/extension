import { baParams } from 'constants/env'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'

import { expect, Page } from '@playwright/test'

test.describe('transfer', () => {
  test.beforeEach(async ({ transferPage }) => {
    await transferPage.init(baParams)
  })

  test('should send a transaction and pay with the current account gas tank', async ({
    transferPage
  }) => {
    const sendToken = tokens.usdc.optimism
    // This address is derived from SA testing account seed phrase
    const recipientAddress = '0xc162b2F9f06143Cf063606d814C7F38ED4471F44'
    const feeToken = tokens.usdc.ethereum
    const payWithGasTank = true

    await transferPage.send(sendToken, recipientAddress, feeToken, payWithGasTank)
  })

  test("should send a transaction and pay with the current account's ERC-20 token", async ({
    transferPage
  }) => {
    const sendToken = tokens.usdc.optimism
    // This address is derived from SA testing account seed phrase
    const recipientAddress = '0xc162b2F9f06143Cf063606d814C7F38ED4471F44'
    const feeToken = tokens.usdc.optimism
    const payWithGasTank = false

    await transferPage.send(sendToken, recipientAddress, feeToken, payWithGasTank)
  })

  test('should batch multiple transfer transactions', async ({ transferPage }) => {
    const page = transferPage.page
    await transferPage.navigateToTransfer()

    // First txn
    const sendToken = tokens.usdc.optimism
    const recipientAddress = '0xc162b2F9f06143Cf063606d814C7F38ED4471F44'
    await transferPage.fillForm(sendToken, recipientAddress)
    await transferPage.addToBatch()

    // Add More
    const addMoreButton = page.getByTestId(selectors.addMoreButton)
    await addMoreButton.click()

    // Second txn
    await transferPage.fillForm(sendToken, recipientAddress)
    await transferPage.addToBatch()

    // Go to Dashboard
    const goDashboardButton = page.getByTestId(selectors.goDashboardButton)
    await goDashboardButton.click()

    // New Page promise
    const context = page.context()
    const actionWindowPagePromise = new Promise<Page>((resolve) => {
      context.once('page', (p) => {
        resolve(p)
      })
    })

    // Open AccountOp screen
    await page.getByTestId(selectors.bannerButtonOpen).first().click()

    // Sign
    const actionWindowPage = await actionWindowPagePromise
    await actionWindowPage.getByTestId(selectors.signTransactionButton).click()

    // Expect the txn to be Confirmed
    await expect(actionWindowPage.getByTestId(selectors.txnConfirmed)).toBeVisible()
  })
})
