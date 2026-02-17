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

  // TODO: maybe it has to be removed

  async waitForEvent(
    predicate: (event: SpeculosEvent) => boolean,
    // TODO: adjust the default
    timeout = 5000000
  ): Promise<SpeculosEvent> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      const { events } = await this.getEvents()
      console.log('Received events from device:', events)
      const event = events.find(predicate)
      if (event) {
        console.log('Matching event found:', event)
        return event
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    throw new Error('Timeout waiting for event')
  }

  async waitForText(text: string, timeout = 10000) {
    const start = Date.now()

    while (Date.now() - start < timeout) {
      const events = await this.getEvents()

      const screenText = JSON.stringify(events)

      if (screenText.includes(text)) {
        return
      }

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
}
