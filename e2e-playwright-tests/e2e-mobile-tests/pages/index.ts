import type { Device } from 'mobilewright'
import { AuthPage } from './authPage'

export class PageManager {
  private _auth?: AuthPage

  constructor(private readonly device: Device) {}

  get auth() {
    return (this._auth ??= new AuthPage(this.device))
  }
}
