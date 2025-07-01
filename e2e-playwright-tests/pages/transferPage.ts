import { expect } from '@playwright/test'
import { bootstrapWithStorage } from 'common-helpers/bootstrap'
import { baParams } from 'constants/env'
import Token from 'interfaces/token'
import selectors from 'constants/selectors'
import { BasePage } from './basePage'

export class TransferPage extends BasePage {
  async init(param) {
    const { page } = await bootstrapWithStorage('transfer', param)
    this.page = page
  }

  async navigateToTransfer() {
    const sendButton = this.page.getByTestId(selectors.dashboardButtonSend)
    await sendButton.click()
  }

  async fillRecipient(address: string) {
    const addressField = this.page.getByTestId(selectors.addressEnsField)
    await addressField.fill(address)
    const checkbox = this.page.getByTestId(selectors.recipientAddressUnknownCheckbox)
    await checkbox.click()
  }

  async fillForm(token: Token, recipientAddress: string) {
    // Choose token
    await this.clickOnMenuToken(token)

    // Amount
    const amountField = this.page.getByTestId(selectors.amountField)
    await amountField.fill('0.001')

    // Address
    await this.fillRecipient(recipientAddress)
  }

  async signAndValidate(feeToken: Token, payWithGasTank?: boolean) {
    // Proceed
    const proceedButton = this.page.getByTestId(selectors.proceedBtn)
    await proceedButton.click()

    // Select Fee token and payer
    await this.clickOnMenuFeeToken(baParams.envSelectedAccount, feeToken, payWithGasTank)

    // Sign & Broadcast
    const sign = this.page.getByTestId(selectors.signButton)
    await sign.click()

    // Validate
    const txnStatus = await this.page.getByTestId(selectors.txnStatus).textContent()
    expect(txnStatus).toEqual('Transfer done!')
  }

  async send(token: Token, recipientAddress: string, feeToken: Token, payWithGasTank?: boolean) {
    await this.navigateToTransfer()
    await this.fillForm(token, recipientAddress)
    await this.signAndValidate(feeToken, payWithGasTank)
  }

  async addToBatch() {
    const batchButton = this.page.getByTestId(selectors.batchBtn)
    await batchButton.click()

    const gotIt = this.page.getByTestId(selectors.batchModalGotIt)
    await gotIt.click()
  }
}
