import selectors from 'constants/selectors'

import { expect } from '@mobilewright/test'

import Token from '../../interfaces/token'

import type { Device, Locator, Screen } from 'mobilewright'

export abstract class BasePageMobile {
  constructor(protected readonly device: Device) {}

  protected get screen(): Screen {
    return this.device.screen
  }

  async expectButtonEnabled(testId: string): Promise<void> {
    await expect(this.screen.getByTestId(testId)).toBeEnabled()
  }

  async expectButtonDisabled(testId: string): Promise<void> {
    await expect(this.screen.getByTestId(testId)).toBeDisabled()
  }

  async selectTokenFromMenu(
    token: Token,
    menuSelector: string = selectors.tokensSelect
  ): Promise<void> {
    await this.screen.getByTestId(menuSelector).tap()

    const bottomSheet: Locator = this.screen.getByTestId(selectors.bottomSheet)
    await expect(bottomSheet).toBeVisible()

    await bottomSheet.getByTestId(selectors.searchInput).fill(token.symbol)
    await bottomSheet.getByTestId(`option-${token.address}.${token.chainId}`).tap()
  }
}
