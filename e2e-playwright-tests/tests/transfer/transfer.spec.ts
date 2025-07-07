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

    await test.step('start send transfer', async () => {
      await transferPage.navigateToTransfer()
    })

    await test.step('add transfer amount', async () => {
      await transferPage.fillAmount(sendToken)
    })

    await test.step('add recepient address', async () => {
      await transferPage.fillRecipient(recipientAddress)
    })

    await test.step('send transaction', async () => {
      await transferPage.signAndValidate(feeToken, payWithGasTank)
    })
  })

  test("should send a transaction and pay with the current account's ERC-20 token", async ({
    transferPage
  }) => {
    const sendToken = tokens.usdc.optimism
    // This address is derived from SA testing account seed phrase
    const recipientAddress = '0xc162b2F9f06143Cf063606d814C7F38ED4471F44'
    const feeToken = tokens.usdc.optimism
    const payWithGasTank = false

    await test.step('start send transfer', async () => {
      await transferPage.navigateToTransfer()
    })

    await test.step('add transfer amount', async () => {
      await transferPage.fillAmount(sendToken)
    })

    await test.step('add recepient address', async () => {
      await transferPage.fillRecipient(recipientAddress)
    })

    await test.step('send transaction', async () => {
      await transferPage.signAndValidate(feeToken, payWithGasTank)
    })
  })

  test('should batch multiple transfer transactions', async ({ transferPage }) => {
    const page = transferPage.page
    // await transferPage.navigateToTransfer()
    const sendToken = tokens.usdc.optimism
    const recipientAddress = '0xc162b2F9f06143Cf063606d814C7F38ED4471F44'

    await test.step('start send transfer', async () => {
      await transferPage.navigateToTransfer()
    })

    await test.step('add first transaction', async () => {
      await transferPage.fillAmount(sendToken)
      await transferPage.fillRecipient(recipientAddress)
      await transferPage.addToBatch()
    })

    await test.step('add more transaction', async () => {
      await transferPage.click(selectors.addMoreButton)
    })

    await test.step('add second transaction', async () => {
      await transferPage.fillAmount(sendToken)
      await transferPage.fillRecipient(recipientAddress)
      await transferPage.addToBatch()
    })

    await test.step('go to dashboard', async () => {
      await transferPage.click(selectors.goDashboardButton)
    })

    await test.step('open AccountOp screen and sign', async () => {
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

  test('add contact in address book and send transaction to newly added contact', async ({
    transferPage
  }) => {
    const newContactName = 'First Address'
    const newContactAddress = '0xC254b41be9582e45a2aCE62D5adD3F8092D4ea6C'
    const sendToken = tokens.usdc.optimism
    const feeToken = tokens.usdc.optimism
    const payWithGasTank = false
    const isUnknownAddress = false

    await test.step('go to address book page', async () => {
      await transferPage.openAddressBookPage()
    })

    await test.step('add new contact', async () => {
      await transferPage.entertext(selectors.contactNameField, newContactName)
      await transferPage.entertext(selectors.addressEnsField, newContactAddress)
      await transferPage.click(selectors.addToAddressBookButton)
    })

    await test.step('newly added address should be visible in Address book section', async () => {
      await transferPage.assertAddedContact(newContactName, newContactAddress)
    })

    await test.step('go to dashboard', async () => {
      await transferPage.navigateToDashboard()
    })

    await test.step('start send transfer', async () => {
      await transferPage.navigateToTransfer()
    })

    await test.step('add transfer amount', async () => {
      await transferPage.fillAmount(sendToken)
    })

    await test.step('add recepient address', async () => {
      await transferPage.fillRecipient(newContactAddress, isUnknownAddress)
    })

    await test.step('send transaction', async () => {
      await transferPage.signAndValidate(feeToken, payWithGasTank)
    })
  })

  test('Start transfer, add contact, send transaction to newly added contact', async ({
    transferPage
  }) => {
    const newContactName = 'First Address'
    const newContactAddress = '0xC254b41be9582e45a2aCE62D5adD3F8092D4ea6C'

    await test.step('start send transfer', async () => {
      await transferPage.navigateToTransfer()
    })

    await test.step('add transfer amount', async () => {
      const feeToken = tokens.usdc.optimism

      await transferPage.fillAmount(feeToken)
    })

    await test.step('add unknown recepient to address book', async () => {
      await transferPage.addUnknownRecepientToAddressBook(newContactAddress, newContactName)
    })

    await test.step('send USCD to added contact', async () => {
      const feeToken = tokens.usdc.optimism
      const payWithGasTank = false

      await transferPage.signAndValidate(feeToken, payWithGasTank)
    })
  })
})
