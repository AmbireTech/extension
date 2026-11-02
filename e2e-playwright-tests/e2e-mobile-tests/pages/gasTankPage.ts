import selectors from 'constants/selectors'

import { expect } from '@mobilewright/test'

import Token from '../../interfaces/token'
import { BasePageMobile } from './basePage'

export class GasTankPage extends BasePageMobile {
  async topUpGasTank(token: Token, amount: string): Promise<void> {
    await this.screen.getByTestId(selectors.dashboardGasTankBalance).tap()
    await this.screen.getByTestId(selectors.topUpButton).tap()

    await this.selectTokenFromMenu(token)

    // Switch to dollar, same as desktop - the controller needs a moment to update before the
    // amount field accepts input.
    await this.screen.getByTestId(selectors.flipIcon).tap()

    const amountField = this.screen.getByTestId(selectors.transaction.amountField)
    await expect(amountField).toBeEnabled({ timeout: 30000 })
    await amountField.fill(amount)
  }
}
