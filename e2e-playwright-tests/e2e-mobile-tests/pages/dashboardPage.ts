import selectors from 'constants/selectors'

import { expect } from '@mobilewright/test'

import { BasePageMobile } from './basePage'

export class DashboardPage extends BasePageMobile {
  async navigateToTransfer(): Promise<void> {
    await this.screen.getByTestId(selectors.dashboard.sendButton).tap()
  }

  async navigateToSwapAndBridge(): Promise<void> {
    await this.screen.getByTestId(selectors.dashboard.swapAndBridgeButton).tap()
  }

  // Opens the Account Select screen. Mobile's entry point for adding another account lives
  // here (button-add-account), not behind a Settings "hamburger" menu like desktop.
  async openAccountSelect(): Promise<void> {
    await this.screen.getByTestId(selectors.accountSelectBtn).tap()
  }

  async checkNoTransactionOnActivityTab(): Promise<void> {
    // await this.screen.getByTestId(selectors.dashboard.activityTabButton).tap()
    await expect(
      this.screen.getByTestId(selectors.dashboard.noTransactionOnActivityTab)
    ).toContainText(
      "Ambire doesn't retrieve transactions made before installing the extension, but you can check your address on etherscan.io."
    )
  }

  /**
   * Opens the first activity row whose label contains `rowText` (e.g. 'Send', 'Fuel gas tank',
   * 'Swap/Bridge') and asserts it confirmed. Desktop pins down the exact row via an XPath text
   * index (selectors.dashboard.transactionSendText and friends), which has no equivalent in the
   * native accessibility tree, so this matches by visible text instead.
   * TODO: narrow this to a dedicated per-row testID once one exists on FE.
   */
  async checkSendTransactionOnActivityTab(rowText: string = 'Send'): Promise<void> {
    await this.screen.getByTestId(selectors.dashboard.activityTabButton).tap()

    const firstTransaction = this.screen.getByText(rowText).first()
    await firstTransaction.waitFor({ state: 'visible' })
    await firstTransaction.tap()

    await expect(
      this.screen.getByTestId(selectors.dashboard.activityTransactionConfirmed)
    ).toContainText('Confirmed')
  }
}
