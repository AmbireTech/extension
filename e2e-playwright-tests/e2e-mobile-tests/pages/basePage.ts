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

    // slowing down; after switching to dollar mode before the amount field accepts input
    await new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
    await menuButton.tap()

    await this.screen.getByTestId(selectors.searchInput).fill(token.symbol)

    // The testID format (`option-${address}.${chainId}`) comes from the shared
    // MenuOption/getTokenId code web and mobile both run - desktop's basePage.ts uses the
    // identical pattern. What's mobile-only is the list itself: it's a native virtualized
    // list, so a row outside the current viewport genuinely doesn't exist in the native UI
    // tree yet (unlike web, which tends to keep the full option list in the DOM). Scroll it
    // into view first, since tapping a not-yet-mounted row would otherwise hang waiting for
    // something that was never there to begin with.
    const option = this.screen.getByTestId(`option-${token.address}.${token.chainId}`)
    await option.scrollIntoViewIfNeeded()
    await option.tap()
  }
}
