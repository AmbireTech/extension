import { LedgerSimulatorClient } from './client'
import { Button, ButtonAction, SpeculosClientOptions } from './types'

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
}
