import { baParams } from 'constants/env'
import selectors from 'constants/selectors'
import Token from 'interfaces/token'

import { expect, Page } from '@playwright/test'

import { BasePage } from './basePage'

export class TransferPage extends BasePage {
  async navigateToTransfer() {
    await this.click(selectors.dashboard.sendButton)
  }

  async openAddressBookPage() {
    await this.click(selectors.dashboard.hamburgerButton)

    // go to Address book page and assert url
    await this.page.locator('//div[contains(text(),"Address Book")]').first().click()
    await this.checkUrl('/settings/address-book')
  }

  async fillAmount(token: Token) {
    await this.page.waitForTimeout(2000) // script misses click due to modal animation sometimes
    await this.clickOnMenuToken(token)
    // Amount
    await this.page.waitForTimeout(2000) // script misses input due to modal animation sometimes
    await this.entertext(selectors.amountField, '0.001')
  }

  async fillRecipient(address: string) {
    // clear input if any
    await this.clearFieldInput(selectors.getStarted.addressEnsField)
    await this.entertext(selectors.getStarted.addressEnsField, address)
    await this.page.waitForTimeout(1000)
  }

  async holdToProceedForUnknownAddress() {
    // For unknown addresses, the proceed button becomes a hold-to-proceed button
    // We need to hold it for the required duration (1600ms) to agree and proceed
    const holdButton = this.page.getByTestId('proceed-btn')

    // Press and hold the button for the required duration
    await holdButton.hover()
    await this.page.mouse.down()
    await this.page.waitForTimeout(2000) // Hold for 2 seconds to ensure completion
    await this.page.mouse.up()
  }

  async fillForm(token: Token, recipientAddress: string) {
    // Choose token
    await this.fillAmount(token)
    // Address
    await this.fillRecipient(recipientAddress)
  }

  async addToBatch() {
    await this.click(selectors.batchBtn)
  }

  async addUnknownRecepientToAddressBook(recepientAddress: string, contactName: string) {
    await this.fillRecipient(recepientAddress)

    // open Add new contact form
    const addNewContactModal = await this.isVisible(selectors.formAddContactNameField)
    // work around; sometimes the one click does not open the modal
    if (!addNewContactModal) {
      await this.click(selectors.sendFormAddToAddresBook)
    }

    // add new contact
    await this.page.waitForTimeout(1000)
    await this.entertext(selectors.formAddContactNameField, contactName)
    await this.click(selectors.formAddToContactsButton)

    // assert snackbar notification
    await expect(this.page.locator(selectors.contactSuccessfullyAddedSnackbar)).toHaveText(
      'Contact added to Address Book'
    )
  }

  async assertAddedContact(contactName: string, contactAddress: string) {
    const addedContactName = this.page.locator(`//div[contains(text(),"${contactName}")]`)
    const addedContactAddress = this.page.locator(`//div[contains(text(),"${contactAddress}")]`)

    await expect(addedContactName).toContainText(contactName)
    await expect(addedContactAddress).toContainText(contactAddress)
  }

  // TODO: move to dashboard page once POM is refactored
  async checkSendTransactionOnActivityTab() {
    await this.click(selectors.dashboard.activityTabButton)

    // When tests are ran in isolation, there would be only 1 txn in the activity tab.
    // But when they are ran in a shared state, we check only the latest one txn, i.e. the first one in the list.
    const firstSendTransaction = this.page.locator(selectors.dashboard.transactionSendText).first()
    const firstConfirmedPill = this.page
      .locator(selectors.dashboard.confirmedTransactionPill)
      .first()

    await expect(firstSendTransaction).toContainText('Send')
    await expect(firstConfirmedPill).toContainText('Confirmed')
  }

  // changing fee speed and checking fee amount, if above 0.1$ transaction won't be signed
  async signSlowSpeedTransaction({
    sendToken,
    feeToken,
    payWithGasTank = true, // pay with gas tank by default
    message
  }: {
    sendToken: Token
    feeToken?: Token
    payWithGasTank?: boolean
    message: string
  }) {
    let feeSelector
    // Proceed
    await this.expectButtonEnabled(selectors.proceedBtn)
    await this.longPressButton(selectors.proceedBtn, 5)

    // approve the high impact modal if appears
    await this.handlePriceWarningModals()

    // Select slow speed
    await this.click(selectors.transaction.feeSpeedSelectDropdown)
    await this.click(selectors.transaction.feeSpeedSlow)

    // Select fee token; default Gas Tank
    if (!payWithGasTank) {
      await this.selectFeeToken(baParams.envSelectedAccount, feeToken, payWithGasTank)
      feeSelector = await this.page
        .locator(selectors.transaction.feeTokenInDollars)
        .innerText({ timeout: 10000 }) // returns e.g. '<$0.01'
    } else {
      feeSelector = await this.page
        .locator(selectors.transaction.feeGasTankInDollars)
        .innerText({ timeout: 10000 }) // returns e.g. '<$0.01'
    }

    const feeDollarsAmount = Number(feeSelector.replace(/[<$]/g, ''))

    if (feeDollarsAmount > 0.1) {
      console.warn(
        `⚠️ Fee amount ($${feeDollarsAmount}) exceeds the $0.10 limit; transaction signing skipped.`
      )
    } else {
      // start monitoring requests
      await this.monitorRequests()

      // Sign & Broadcast
      await this.expectButtonEnabled(selectors.signButton)
      await this.click(selectors.signButton)
      await this.compareText(
        selectors.transaction.confirmingYourTransactionText,
        'Confirming your trade'
      )

      // Validate requests
      const { rpc } = this.getCategorizedRequests()

      this.stopMonitorRequests()

      // Verify that portfolio updates run only for the send token network.
      // A previous regression was triggering updates on all enabled networks after a broadcast,
      // which caused a significant performance downgrade.
      expect(
        rpc.every((req) => req === `https://invictus.ambire.com/${sendToken.chainName}`),
        `Invalid portfolio update behavior detected.
   After a broadcast, the portfolio must be refreshed only for *${sendToken.chainName}*.
   However, RPC requests were also made for other networks: ${rpc.toString()}`
      ).toEqual(true)

      // validate success message
      const timeout = 150000
      await this.compareText(selectors.txnStatus, message, { timeout })

      // Close page
      await this.click(selectors.closeProgressModalButton)
    }
  }

  async checkRecepientTransactionOnExplorer({
    newPage,
    recepientAddress,
    options
  }: {
    newPage: Page
    recepientAddress: string
    options?: { expectedTransactionsCount?: number }
  }): Promise<void> {
    const expectedTransactionsCount = options?.expectedTransactionsCount ?? 1 // expect at least 1 transaction
    let transactionDetails: any

    // assert signed block
    await expect(newPage.getByTestId(selectors.transaction.explorer.txnSignedStep)).toContainText(
      'Signed'
    )

    // assert transaction details block
    await expect(newPage.getByTestId(selectors.transaction.explorer.txnProgressStep)).toContainText(
      'Transaction details'
    )

    for (let i = 0; i < expectedTransactionsCount; i++) {
      // eslint-disable-next-line no-await-in-loop
      transactionDetails = newPage
        .getByTestId(selectors.transaction.explorer.recepientAddressBlock)
        .nth(i)
    }
    await expect(transactionDetails).toHaveText(/Send/)
    await expect(transactionDetails).toHaveText(/0\.001/)
    await expect(transactionDetails).toHaveText(/USDC/)
    await expect(transactionDetails).toHaveText(new RegExp(recepientAddress))
    // assert confirmed block
    await expect(
      newPage.getByTestId(selectors.transaction.explorer.txnConfirmedStep)
    ).toContainText('confirmed')
  }
}
