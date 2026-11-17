import { KEYSTORE_PASS } from 'constants/env'
import selectors from 'constants/selectors'

import { expect } from '@mobilewright/test'

import Token from '../../interfaces/token'
import { BasePageMobile } from './basePage'

export class TransferPage extends BasePageMobile {
  async fillAmount(token: Token, amount: string = '0.001'): Promise<void> {
    await this.selectTokenFromMenu(token)
    await this.screen.getByTestId(selectors.transaction.amountField).fill(amount)
  }

  async fillRecipient(address: string): Promise<void> {
    await this.screen.getByTestId(selectors.getStarted.addressEnsField).fill(address)
  }

  // For unknown addresses the Proceed button becomes a hold-to-proceed button. mobilewright
  // exposes a native long-press gesture, unlike desktop which has to fake it with
  // hover + mouse down/up (see desktop TransferPage.holdToProceedForUnknownAddress).
  async holdToProceed(durationMs: number = 1700): Promise<void> {
    await this.screen.getByTestId(selectors.transaction.proceedBtn).longPress({
      duration: durationMs
    })
  }

  /**
   * Confirms the mobile-only signing-authentication bottom sheet (password/biometrics
   * re-confirmation) that appears after tapping Sign. Desktop has no equivalent step — the
   * keystore signs directly once the sign button is clicked (see the note in desktop's
   * TransferPage.signSlowSpeedTransaction) - so this is a no-op if the sheet never shows up.
   */
  private async confirmSigningAuthIfPresent(): Promise<void> {
    const passwordField = this.screen.getByTestId(selectors.transaction.signPassAuthField)
    const appeared = await passwordField.isVisible({ timeout: 5000 }).catch(() => false)
    if (!appeared) return

    await passwordField.fill(KEYSTORE_PASS)
    await this.screen.getByTestId(selectors.transaction.signConfirmButton).tap()
  }

  // Changes fee speed and checks the fee amount; if above the $0.10 test budget, the
  // transaction is left unsigned so the caller can skip the test instead of spending real funds.
  async signSlowSpeedTransaction({
    message,
    holdProceedButton = true,
    awaitConfirmation = true
  }: {
    message: string
    holdProceedButton?: boolean
    awaitConfirmation?: boolean
  }): Promise<boolean> {
    await this.expectButtonEnabled(selectors.transaction.proceedBtn)
    if (holdProceedButton) {
      await this.holdToProceed()
    } else {
      await this.screen.getByTestId(selectors.transaction.proceedBtn).tap()
    }

    // Select slow speed
    await this.screen.getByTestId(selectors.transaction.feeSpeedSelectDropdown).tap()
    await this.screen.getByTestId(selectors.transaction.feeSpeedSlow).tap()

    // Desktop reads the fee out of a specific child node via an XPath (feeTokenInDollars),
    // which has no native-accessibility-tree equivalent; the dropdown's own text already
    // contains the dollar amount, so read that directly instead.
    const feeText = await this.screen
      .getByTestId(selectors.transaction.feeTokensSelectDropdown)
      .getText()
    const feeDollarsAmount = Number.parseFloat(feeText.replace(/[^0-9.]/g, ''))

    if (feeDollarsAmount > 0.1) {
      console.warn(
        `⚠️ Fee amount ($${feeDollarsAmount}) exceeds the $0.10 limit; transaction signing skipped.`
      )
      return false
    }

    await this.expectButtonEnabled(selectors.signButton)
    await this.screen.getByTestId(selectors.signButton).tap()

    await this.confirmSigningAuthIfPresent()

    if (awaitConfirmation) {
      await expect(this.screen.getByTestId(selectors.txnStatus)).toContainText(message, {
        timeout: 30000
      })
    }

    await this.screen.getByTestId(selectors.closeProgressModalButton).tap()

    return true
  }
}
