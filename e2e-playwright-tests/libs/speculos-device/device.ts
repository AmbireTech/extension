import { LedgerSimulatorClient } from './client'
import { Button, ButtonAction, SpeculosClientOptions, SpeculosEvent } from './types'

export const LEDGER_ETH_SCREENS = {
  SELECTOR: {
    VERIFY: 'Verify selector',
    CONFIRM: 'Confirm selector'
  },
  PARAMETER: {
    VERIFY: 'Verify parameter',
    CONFIRM: 'Confirm parameter'
  },
  REVIEW: 'Review',
  ACCEPT: 'Accept',
  SIGN: 'Sign',
  BOTH_BUTTONS: 'both buttons'
} as const

// resource: https://petstore.swagger.io/?url=https://raw.githubusercontent.com/LedgerHQ/speculos/master/speculos/api/static/swagger/swagger.json#/default/get_events
export class SpeculosDevice {
  private client: LedgerSimulatorClient

  constructor(options: SpeculosClientOptions) {
    this.client = new LedgerSimulatorClient(options)
  }

  async wait(timeInMs: number) {
    return new Promise((resolve) => setTimeout(resolve, timeInMs))
  }

  pressButton(button: Button, action: ButtonAction = 'press-and-release') {
    return this.client.post(`/button/${button}`, { action })
  }

  pressLeftButton() {
    return this.pressButton('left')
  }

  pressRightButton() {
    return this.pressButton('right')
  }

  pressBothButtons() {
    return this.pressButton('both')
  }

  async getEvents() {
    return this.client.getJson<{ events: SpeculosEvent[] }>('/events')
  }

  async resetEvents(): Promise<void> {
    await this.client.delete('/events')
  }

  async waitForText(text: string, timeout = 10000) {
    const start = Date.now()

    while (Date.now() - start < timeout) {
      const events = await this.getEvents()

      const screenText = JSON.stringify(events)

      if (screenText.includes(text)) {
        return text
      }

      await new Promise((r) => setTimeout(r, 300))
    }

    throw new Error(`Timeout waiting for text: ${text}`)
  }

  async nextUntilText(text: string, timeout = 10000) {
    const start = Date.now()

    while (Date.now() - start < timeout) {
      const events = await this.getEvents()

      const screenText = JSON.stringify(events)

      if (screenText.includes(text)) {
        return
      }

      await this.pressRightButton()
      await new Promise((r) => setTimeout(r, 300))
    }

    throw new Error(`Timeout waiting for text: ${text}`)
  }

  /**
   * Useful helper for signing flows:
   * Keep pressing right until "Accept" appears,
   * then press both to confirm.
   */
  async confirmTransactionFlow() {
    await this.resetEvents()

    const start = Date.now()
    const timeout = 20000

    while (Date.now() - start < timeout) {
      const { events } = await this.getEvents()

      const currentText = events
        .map((e) => e.text)
        .filter(Boolean)
        .join(' ')

      console.log('Current screen:', currentText)

      if (currentText.includes('Accept') || currentText.includes('Sign')) {
        await this.pressBothButtons()
        return
      }

      await this.pressRightButton()
      await this.wait(400)
    }

    throw new Error('Timeout waiting for Accept/Sign screen')
  }

  /**
   * Enables Blind Signing in the Ethereum Ledger app.
   *
   * Flow:
    * 1. From the main screen, navigate to "Settings" and enter it.
    * 2. Navigate to "Blind signing" and enter it.
    * 3. Enable the following settings:
        - Display contract data details (IMPORTANT: this should be enabled for testing signing transactions with Ledger, otherwise transactions won't be signed)
    * 4. Go back to the main screen.
   *
   * Note: Make sure to enable Blind signing before running tests that involve signing transactions with Ledger, otherwise the transactions won't be signed.
   */
  async enableBlindSigning() {
    // Go to Settings (usually first screen after app open)
    await this.waitForText('app is ready')
    await this.pressRightButton() // navigate to Settings
    await this.waitForText('App settings')
    await this.pressBothButtons() // enter Settings

    // Navigate to Blind signing
    // enable Blind signing
    // NOTE: THIS SHOULD BE ENABLED FOR TESTING SIGNING TRANSACTIONS WITH LEDGER, OTHERWISE TRANSACTIONS WON'T BE SIGNED
    await this.waitForText('Blind signing')
    await this.pressBothButtons()

    // Display nonce in transaction
    await this.pressRightButton()

    // Display raw content of EIP712 messages
    await this.pressRightButton()

    // NOTE: THIS SHOULD BE ENABLED FOR TESTING SIGNING TRANSACTIONS WITH LEDGER, OTHERWISE TRANSACTIONS WON'T BE SIGNED
    // Display contract data details
    await this.pressRightButton()
    await this.pressBothButtons()

    // Enable EIP-7702 authorization
    await this.pressRightButton()

    // Always display the transaction hash
    await this.pressRightButton()

    await this.pressRightButton()

    await this.waitForText('Back')
    await this.pressBothButtons() // confirm going back to main screen
    await this.pressLeftButton()
  }

  /**
   * Helper method to sign transactions in tests.
   * It navigates through the transaction confirmation flow and confirms the transaction on the Ledger device.
   * Make sure to enable Blind signing in the Ledger settings before using this method, otherwise the transaction won't be signed.
   */
  async signTransaction() {
    await this.waitForText(LEDGER_ETH_SCREENS.SELECTOR.VERIFY)
    await this.nextUntilText(LEDGER_ETH_SCREENS.SELECTOR.CONFIRM)
    await this.pressBothButtons()

    await this.waitForText(LEDGER_ETH_SCREENS.PARAMETER.VERIFY)
    await this.nextUntilText(LEDGER_ETH_SCREENS.PARAMETER.CONFIRM)
    await this.pressBothButtons()

    await this.waitForText(LEDGER_ETH_SCREENS.PARAMETER.VERIFY)
    await this.pressRightButton()
    await this.pressRightButton()

    await this.waitForText(LEDGER_ETH_SCREENS.PARAMETER.CONFIRM)
    await this.pressBothButtons()

    await this.signSmartAccountTransaction()
  }

  async signSmartAccountTransaction() {
    await this.waitForText(LEDGER_ETH_SCREENS.BOTH_BUTTONS)
    await this.pressBothButtons()

    await this.waitForText(LEDGER_ETH_SCREENS.REVIEW)
    await this.confirmTransactionFlow()
  }
}
