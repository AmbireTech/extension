import selectors from 'constants/selectors'

import Token from '../../interfaces/token'
import { BasePageMobile } from './basePage'

export class SwapAndBridgePage extends BasePageMobile {
  async openSwapAndBridge(): Promise<void> {
    await this.screen.getByTestId(selectors.dashboard.swapAndBridgeButton).tap()
  }

  async selectSendToken(token: Token): Promise<void> {
    await this.selectTokenFromMenu(token, selectors.swapAndBridge.fromTokenDropdown)
  }

  // The receive network does not follow the send token, so it's selected explicitly, same as
  // desktop (see desktop SwapAndBridgePage.selectReceiveNetwork).
  async selectReceiveNetwork(token: Token): Promise<void> {
    await this.screen.getByTestId(selectors.swapAndBridge.receiveNetworkDropdown).tap()
    await this.screen
      .getByTestId(selectors.bottomSheet)
      .getByTestId(`option-${token.chainId}`)
      .tap()
  }

  async selectReceiveToken(token: Token): Promise<void> {
    await this.selectTokenFromMenu(token, selectors.swapAndBridge.receiveTokenDropdown)
  }

  async prepareSwapAndBridge(amount: number, fromToken: Token, toToken: Token): Promise<void> {
    await this.openSwapAndBridge()
    await this.selectSendToken(fromToken)
    await this.selectReceiveNetwork(toToken)
    await this.selectReceiveToken(toToken)
    await this.screen.getByTestId(selectors.fromAmountInputSab).fill(amount.toString())
  }
}
