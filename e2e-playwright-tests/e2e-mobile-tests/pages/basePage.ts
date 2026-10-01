import type { Device, Screen } from 'mobilewright'

export abstract class BasePageMobile {
  constructor(protected readonly device: Device) {}

  protected get screen(): Screen {
    return this.device.screen
  }
}
