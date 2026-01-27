import { baParams, SA_ADDRESS } from 'constants/env'
import selectors from 'constants/selectors'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'

import { expect } from '@playwright/test'

import { runBatchTransferFlow, runSimpleTransferFlow } from '../../flows/transferFlow'

test.describe('transfer', { tag: '@transfer' }, () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(baParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test.only('should send a transaction and pay with the current account gas tank', async ({ pages }) => {
    await runSimpleTransferFlow({
      pages,
      sendToken: tokens.usdc.optimism,
      recipientAddress: SA_ADDRESS,
      feeToken: tokens.usdc.ethereum,
      payWithGasTank: true,
      message: 'Transfer done!',
      assertNoInitialTx: true
    })
  })

  test("should send a transaction and pay with the current account's ERC-20 token", async ({
    pages
  }) => {
    await runSimpleTransferFlow({
      pages,
      sendToken: tokens.usdc.optimism,
      recipientAddress: '0xc162b2F9f06143Cf063606d814C7F38ED4471F44',
      feeToken: tokens.usdc.optimism,
      payWithGasTank: false,
      message: 'Transfer done!',
      assertNoInitialTx: true
    })
  })

  test('should batch multiple transfer transactions', async ({ pages }) => {
    await runBatchTransferFlow({
      pages,
      sendToken: tokens.usdc.optimism,
      recipientAddress: '0xc162b2F9f06143Cf063606d814C7F38ED4471F44'
    })
  })

  test('add contact in address book and send transaction to newly added contact', async ({
    pages
  }) => {
    const newContactName = 'First Address'
    const newContactAddress = '0xC254b41be9582e45a2aCE62D5adD3F8092D4ea6C'
    const sendToken = tokens.usdc.optimism
    const feeToken = tokens.usdc.optimism
    const payWithGasTank = false
    const message = 'Transfer done!'

    await test.step('assert no transaction on Activity tab', async () => {
      await pages.dashboard.checkNoTransactionOnActivityTab()
    })

    await test.step('go to address book page', async () => {
      await pages.transfer.openAddressBookPage()
    })

    await test.step('add new contact', async () => {
      await pages.transfer.click(selectors.addContactFormButton)
      await pages.transfer.entertext(selectors.contactNameField, newContactName)
      await pages.transfer.entertext(selectors.getStarted.addressEnsField, newContactAddress)
      await pages.transfer.click(selectors.addToAddressBookButton)
    })

    await test.step('newly added address should be visible in Address book section', async () => {
      await pages.transfer.assertAddedContact(newContactName, newContactAddress)
    })

    await test.step('go to dashboard', async () => {
      await pages.dashboard.navigateToDashboard()
    })

    await test.step('start send transfer', async () => {
      await pages.transfer.navigateToTransfer()
    })

    await test.step('add transfer amount', async () => {
      await pages.transfer.fillAmount(sendToken)
    })

    await test.step('add recepient address', async () => {
      await pages.transfer.fillRecipient(newContactAddress)
    })

    await test.step('send transaction', async () => {
      await pages.transfer.signSlowSpeedTransaction({
        feeToken,
        payWithGasTank,
        sendToken,
        message
      })
    })

    await test.step('assert new transaction on Activity tab', async () => {
      await pages.transfer.checkSendTransactionOnActivityTab()
    })

    await test.step('assert funds sent to recepient address on explorer', async () => {
      const viewTransactionLink = pages.basePage.page.getByTestId(
        selectors.dashboard.viewTransactionLink
      )
      const viewTransactionTab = await pages.basePage.handleNewPage(viewTransactionLink)

      // check url of new tab
      expect(viewTransactionTab.url()).toContain('explorer.ambire.com')

      await pages.transfer.checkRecepientTransactionOnExplorer({
        newPage: viewTransactionTab,
        recepientAddress: newContactAddress
      })
    })
  })

  test('Start transfer, add contact, send transaction to newly added contact', async ({
    pages
  }) => {
    const sendToken = tokens.usdc.optimism
    const feeToken = tokens.usdc.optimism
    const newContactName = 'First Address'
    const newContactAddress = '0xC254b41be9582e45a2aCE62D5adD3F8092D4ea6C'
    const message = 'Transfer done!'

    await test.step('assert no transaction on Activity tab', async () => {
      await pages.dashboard.checkNoTransactionOnActivityTab()
    })

    await test.step('start send transfer', async () => {
      await pages.transfer.navigateToTransfer()
    })

    await test.step('add transfer amount', async () => {
      await pages.transfer.fillAmount(sendToken)
    })

    await test.step('add unknown recepient to address book', async () => {
      await pages.transfer.addUnknownRecepientToAddressBook(newContactAddress, newContactName)
    })

    await test.step('send USCD to added contact', async () => {
      await pages.transfer.signSlowSpeedTransaction({
        feeToken,
        sendToken,
        message
      })
    })

    await test.step('assert new transaction on Activity tab', async () => {
      await pages.transfer.checkSendTransactionOnActivityTab()
    })

    await test.step('assert funds sent to recepient address on explorer', async () => {
      const viewTransactionLink = pages.basePage.page.getByTestId(
        selectors.dashboard.viewTransactionLink
      )
      const viewTransactionTab = await pages.basePage.handleNewPage(viewTransactionLink)

      // check url of new tab
      expect(viewTransactionTab.url()).toContain('explorer.ambire.com')

      await pages.transfer.checkRecepientTransactionOnExplorer({
        newPage: viewTransactionTab,
        recepientAddress: newContactAddress
      })
    })
  })
})
