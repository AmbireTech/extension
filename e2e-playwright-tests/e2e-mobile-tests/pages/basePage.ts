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
    const menuButton = this.screen.getByTestId(menuSelector)

    // Right after a fresh private-key import, the portfolio fetch may not have started (or
    // finished) yet. The field (SendForm's amountSelectDisabled, see useGetTokenSelectProps)
    // is disabled both while loading ("Loading tokens...") and when the list is genuinely
    // empty ("No tokens found") - a refetch can bounce the field from one disabled state's
    // text to the other's, so waiting for any specific text to disappear is not reliable.
    // Wait on the control's actual enabled state instead: tapping it while disabled is a
    // silent no-op that leaves the bottom sheet assertion below to fail with a misleading
    // "not visible" error instead of the real cause.
    await expect(menuButton).toBeEnabled({ timeout: 60000 })
    await menuButton.tap()

    const bottomSheet: Locator = this.screen.getByTestId(selectors.bottomSheet)
    await expect(bottomSheet).toBeVisible()

    await bottomSheet.getByTestId(selectors.searchInput).fill(token.symbol)
    await bottomSheet.getByTestId(`option-${token.address}.${token.chainId}`).tap()
  }
}
