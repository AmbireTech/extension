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

  async waitForEvent(
    predicate: (event: SpeculosEvent) => boolean,
    timeout = 5000000
  ): Promise<SpeculosEvent> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      const { events } = await this.getEvents()
      console.log('AllFound events:', events)
      const event = events.find(predicate)
      if (event) {
        console.log('Found event:', event)
        return event
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    throw new Error('Timeout waiting for event')
  }
}
