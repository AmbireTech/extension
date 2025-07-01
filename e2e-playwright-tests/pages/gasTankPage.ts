import selectors from 'constants/selectors'

import { bootstrapWithStorage } from '@helpers/bootstrap'
import { expect } from '@playwright/test'

import Token from '../interfaces/token'
import { BasePage } from './basePage'

export class GasTankPage extends BasePage {
  async init(param) {
    const { page } = await bootstrapWithStorage('gasTank', param)
    this.page = page
  }

  async getCurrentBalance() {
    const amountText = await this.page.getByTestId(selectors.dashboardGasTankBalance).innerText()
    const amountNumber = parseFloat(amountText.replace(/[^\d.]/g, ''))

    return amountNumber
  }

  async topUpGasTank(token: Token, amount: string) {
    await this.page.getByTestId(selectors.dashboardGasTankButton).click()
    await this.page.getByTestId(selectors.topUpButton).click()

    await this.clickOnMenuToken(token)

    // Switch to dollar
    await this.page.getByTestId(selectors.flipIcon).click()

    // Amount
    const amountField = this.page.getByTestId(selectors.amountField)
    await amountField.fill(amount)

    await this.signAndValidate()
  }

  async signAndValidate() {
    // Proceed
    const proceedButton = this.page.getByTestId(selectors.proceedBtn)
    await proceedButton.click()

    // Sign & Broadcast
    const sign = this.page.getByTestId(selectors.signButton)
    await sign.click()

    // Validate
    const txnStatus = await this.page.getByTestId(selectors.txnStatus).textContent()
    expect(txnStatus).toEqual('Top up ready!')

    await this.page.getByTestId(selectors.closeProgressModalButton).click()
  }

  async refreshUntilNewBalanceIsVisible(balance: number) {
    let retries = 10
    let oldBalance = balance
    let newBalance = await this.getCurrentBalance()

    while (newBalance <= oldBalance && retries > 0) {
      await this.page.getByTestId(selectors.refreshButton).click()
      await this.page.waitForTimeout(5000)

      newBalance = await this.getCurrentBalance()

      retries--
    }
    return newBalance
  }
}
