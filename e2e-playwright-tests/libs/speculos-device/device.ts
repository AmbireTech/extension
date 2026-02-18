import { LedgerSimulatorClient } from './client'
import { Button, ButtonAction, SpeculosClientOptions, SpeculosEvent } from './types'

// resource: https://petstore.swagger.io/?url=https://raw.githubusercontent.com/LedgerHQ/speculos/master/speculos/api/static/swagger/swagger.json#/default/get_events
export class SpeculosDevice {
  private client: LedgerSimulatorClient

  constructor(options: SpeculosClientOptions) {
    this.client = new LedgerSimulatorClient(options)
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
    await this.waitForText('Review')

    // Navigate forward screens
    for (let i = 0; i < 10; i++) {
      const events = await this.getEvents()
      const text = JSON.stringify(events)

      if (text.includes('Accept') || text.includes('Sign')) {
        break
      }

      await this.pressRightButton()
      await new Promise((r) => setTimeout(r, 400))
    }

    await this.pressBothButtons()
  }

  /**
   * Enables Blind Signing in the Ethereum Ledger app.
   *
   * Flow:
   * 1. Open Settings
   * 2. Navigate to "Blind signing"
   * 3. Toggle to Enabled
   * 4. Exit settings
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

  async signTransaction() {
    await this.waitForText('Verify selector')
    await this.nextUntilText('Confirm selector')
    await this.pressBothButtons()

    await this.waitForText('Verify selector')
    await this.nextUntilText('Confirm parameter')
    await this.pressBothButtons()

    await this.waitForText('Verify parameter')
    await this.pressRightButton()
    await this.pressRightButton()

    await this.waitForText('Confirm parameter')
    await this.pressBothButtons()

    await this.waitForText('both buttons')
    await this.pressBothButtons()

    await this.waitForText('Review transaction')

    await this.confirmTransactionFlow()
  }
}
