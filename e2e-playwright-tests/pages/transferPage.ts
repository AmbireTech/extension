import { baParams } from 'constants/env'
import selectors from 'constants/selectors'
import Token from 'interfaces/token'

import { expect } from '@playwright/test'

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

  async fillRecipient(address: string, isUnknownAddress: boolean = true) {
    // clear input if any
    await this.clearFieldInput(selectors.getStarted.addressEnsField)
    await this.entertext(selectors.getStarted.addressEnsField, address)
    await this.page.waitForTimeout(1000)
    // if address is unknown checkbox has to be checked
    if (isUnknownAddress) {
      await this.click(selectors.recipientAddressUnknownCheckbox)
    }
  }

  async fillForm(token: Token, recipientAddress: string) {
    // Choose token
    await this.fillAmount(token)
    // Address
    await this.fillRecipient(recipientAddress)
  }

  async signAndValidate({
    feeToken,
    payWithGasTank,
    sendToken
  }: {
    feeToken: Token
    payWithGasTank?: boolean
    sendToken: Token
  }) {
    // Proceed
    await this.expectButtonEnabled(selectors.proceedBtn)
    await this.click(selectors.proceedBtn)

    // Select Fee token and payer
    await this.clickOnMenuFeeToken(baParams.envSelectedAccount, feeToken, payWithGasTank)

    await this.monitorRequests()

    // Sign & Broadcast
    await this.expectButtonEnabled(selectors.signButton)
    await this.click(selectors.signButton)

    // Validate
    await this.compareText(selectors.txnStatus, 'Transfer done!')

    const { rpc } = this.getCategorizedRequests()

    // Verify that portfolio updates run only for the send token network.
    // A previous regression was triggering updates on all enabled networks after a broadcast,
    // which caused a significant performance downgrade.
    expect(
      rpc.every((req) => req === `https://invictus.ambire.com/${sendToken.chainName}`),
      `Invalid portfolio update behavior detected.
   After a broadcast, the portfolio must be refreshed only for *${sendToken.chainName}*.
   However, RPC requests were also made for other networks: ${rpc.toString()}`
    ).toEqual(true)

    // Close page
    await this.click(selectors.closeProgressModalButton)
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
    await expect(this.page.locator(selectors.dashboard.transactionSendText)).toContainText('Send')
    await expect(this.page.locator(selectors.dashboard.confirmedTransactionPill)).toContainText(
      'Confirmed'
    )
  }
}
