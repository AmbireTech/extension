import type { Pq1Account, Pq1Device } from 'pq1-sdk'
import { Pq1DeviceManager } from 'pq1-sdk/extension'

import EmittableError from '@ambire-common/classes/EmittableError'
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { IEventEmitterRegistryController, Statuses } from '@ambire-common/interfaces/eventEmitter'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'

import { pq1Logger } from '../../libs/pq1/context'
import { toUserFacingPq1Error } from '../../libs/pq1/errors'

/** How many of the device's accounts the connect screen offers. */
const ACCOUNTS_OFFERED = 5

export const STATUS_WRAPPED_METHODS = {
  loadAccounts: 'INITIAL'
} as const

/**
 * Owns the one WebHID connection to the PQ1 (through `pq1-sdk`'s
 * `Pq1DeviceManager`) and implements Ambire's `ExternalSignerController`, so
 * the keystore treats it like any other hardware wallet controller.
 *
 * PQ1 has no BIP-32 derivation: the device holds 256 numbered accounts, each
 * its own smart-contract wallet, and `PQ1Signer` addresses them by number.
 *
 * The connection lives here, in the background, and nowhere else. Opening a
 * PQ1 for the first time needs a user gesture, so the connect screen only
 * grants the browser's permission; the background then opens the device
 * through that permission, reads the accounts for the screen, and signs.
 * The connection stays open while the service worker lives (a replug or a
 * dead handle reconnects on the next request), which also keeps the SDK's
 * init-code cache warm.
 *
 * There is no `signingCleanup`: a PQ1 sign command is one-shot, with no
 * session to reset, and an unwanted request is rejected on the device.
 */
class PQ1Controller extends EventEmitter implements ExternalSignerController {
  type = 'pq1'

  deviceModel = 'pq1'

  /** Identifies the device: the first 6 bytes of its account 0 address. Set
   *  once the device is unlocked, cleared when it goes away. */
  deviceId = ''

  /** Whether a PQ1 is connected right now. */
  isConnected = false

  /** The device's first accounts, read for the connect screen. */
  accounts: Pq1Account[] = []

  statuses: Statuses<keyof typeof STATUS_WRAPPED_METHODS> = STATUS_WRAPPED_METHODS

  #manager: Pq1DeviceManager

  constructor(eventEmitterRegistry: IEventEmitterRegistryController) {
    super(eventEmitterRegistry)
    this.#manager = new Pq1DeviceManager({
      logger: pq1Logger,
      onChange: (connected) => {
        this.isConnected = connected
        // The accounts came from the device that went away.
        if (!connected) {
          this.deviceId = ''
          this.accounts = []
        }
        this.emitUpdate()
      }
    })
  }

  isUnlocked() {
    return this.#manager.isConnected() && !!this.deviceId
  }

  /**
   * The connected PQ1, unlocked. Opens it through the permission the connect
   * screen granted (no user gesture needed), or reuses the open connection
   * after checking it is still alive. When the device is locked (it locks
   * itself after two minutes without use), the device asks for its PIN and
   * this resolves once the user has entered it.
   */
  async getUnlockedDevice(): Promise<Pq1Device> {
    const device = await this.#manager.getDevice()
    await device.unlock()
    this.deviceId = await device.getDeviceId()
    return device
  }

  /** Read the first accounts of the PQ1 for the connect screen, after it got
   *  the browser's permission to use the device. */
  async loadAccounts() {
    await this.withStatus('loadAccounts', async () => {
      try {
        const device = await this.getUnlockedDevice()
        this.accounts = await device.getAccounts({ count: ACCOUNTS_OFFERED })
      } catch (e) {
        this.accounts = []
        const error = toUserFacingPq1Error(
          e,
          "Couldn't connect to the PQ1. Plug it in with the USB cable and try again."
        )
        throw new EmittableError({ message: error.message, level: 'major', error })
      }
    })
  }

  /** Forget the accounts read for the connect screen. */
  resetAccounts() {
    this.accounts = []
    this.emitUpdate()
  }
}

export default PQ1Controller
