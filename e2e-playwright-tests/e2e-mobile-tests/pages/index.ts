import type { Device } from 'mobilewright'
import { AuthPage } from './authPage'
import { DashboardPage } from './dashboardPage'
import { GasTankPage } from './gasTankPage'
import { SwapAndBridgePage } from './swapAndBridgePage'
import { TransferPage } from './transferPage'

/**
 * @description centralized file for initiating pages instances
 */

export class PageManager {
  private _auth?: AuthPage

  private _dashboard?: DashboardPage

  private _transfer?: TransferPage

  private _gasTank?: GasTankPage

  private _swapAndBridge?: SwapAndBridgePage

  constructor(private readonly device: Device) {}

  get auth() {
    return (this._auth ??= new AuthPage(this.device))
  }

  get dashboard() {
    return (this._dashboard ??= new DashboardPage(this.device))
  }

  get transfer() {
    return (this._transfer ??= new TransferPage(this.device))
  }

  get gasTank() {
    return (this._gasTank ??= new GasTankPage(this.device))
  }

  get swapAndBridge() {
    return (this._swapAndBridge ??= new SwapAndBridgePage(this.device))
  }
}
