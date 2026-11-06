import type { Pq1Account, Pq1Device } from 'pq1-sdk'
import { Pq1DeviceManager } from 'pq1-sdk/extension'

import EmittableError from '@ambire-common/classes/EmittableError'
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { Account } from '@ambire-common/interfaces/account'
import { IEventEmitterRegistryController, Statuses } from '@ambire-common/interfaces/eventEmitter'
import { ExternalSignerController, ReadyToAddKeys } from '@ambire-common/interfaces/keystore'

import { pq1InitCodeCache, pq1Logger } from '../../libs/pq1/context'
import { toUserFacingPq1Error } from '../../libs/pq1/errors'
import { buildPQ1AccountsToImport } from '../../libs/pq1/importAccounts'

/** How many of the device's accounts the connect screen offers. */
const ACCOUNTS_OFFERED = 5

/** What `PQ1Controller` needs from the rest of the wallet to prepare an import. The
 *  controller is created before `MainController` (which takes it as an external signer
 *  controller), so these are callbacks that reach `MainController` once it exists. */
export type PQ1ControllerOptions = {
  /** The accounts already in the wallet, to name the new ones after them and keep the
   *  names of those being re-imported. */
  getImportedAccounts: () => Account[]
  /** Hands the accounts and keys to the account picker's `prepareAccounts`, for the
   *  personalize step to add. */
  onPrepareAccounts: (prepared: { accounts: Account[]; keys: ReadyToAddKeys }) => Promise<void>
  /** Replies to a UI request made with `dispatchAndWait`. */
  sendUiMessage: (reply: UiRequestReply) => void
}

/** The reply `dispatchAndWait` waits for: resolves it when `ok`, rejects it with `error`
 *  otherwise. */
type UiRequestReply =
  | { requestId: string; ok: true }
  | { requestId: string; ok: false; error: string }

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

  #getImportedAccounts: PQ1ControllerOptions['getImportedAccounts']

  #onPrepareAccounts: PQ1ControllerOptions['onPrepareAccounts']

  #sendUiMessage: PQ1ControllerOptions['sendUiMessage']

  constructor(
    eventEmitterRegistry: IEventEmitterRegistryController,
    { getImportedAccounts, onPrepareAccounts, sendUiMessage }: PQ1ControllerOptions
  ) {
    super(eventEmitterRegistry)
    this.#getImportedAccounts = getImportedAccounts
    this.#onPrepareAccounts = onPrepareAccounts
    this.#sendUiMessage = sendUiMessage
    this.#manager = new Pq1DeviceManager({
      // Never left to the SDK's default, which reads chrome.storage.local itself
      cache: pq1InitCodeCache,
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

  /**
   * Prepares the accounts the user selected on the connect screen (by their number on the
   * device) for the personalize step, which adds them - nothing is written here. The
   * addresses and the device id come from what this controller read from the device, never
   * from the UI. Replies to `requestId` once they are prepared, or with the error.
   */
  async prepareAccountsToImport(accountIndices: number[], requestId?: string) {
    const selectedAccounts = this.accounts.filter(({ index }) => accountIndices.includes(index))
    // The accounts are dropped when the device goes away, so there is nothing to import from
    if (!this.deviceId || !selectedAccounts.length) {
      const message = 'The PQ1 was disconnected. Plug it in and connect again.'
      this.emitError({ level: 'major', message, error: new Error(message) })
      this.#replyToRequest(requestId, message)
      return
    }

    try {
      const { accounts, keys } = buildPQ1AccountsToImport(
        selectedAccounts.map(({ index, address }) => ({ accountIndex: index, addr: address })),
        this.deviceId,
        this.#getImportedAccounts()
      )
      await this.#onPrepareAccounts({ accounts, keys: { internal: [], external: keys } })
    } catch (error: any) {
      const message = "Couldn't prepare the PQ1 accounts for import. Please try again."
      this.emitError({ level: 'major', message, error })
      this.#replyToRequest(requestId, message)
      return
    }

    this.#replyToRequest(requestId)
  }

  /** Forget the accounts read for the connect screen. */
  resetAccounts() {
    this.accounts = []
    this.emitUpdate()
  }

  /**
   * Replies to the UI request behind a call (if there is one), so the UI can await it
   * instead of watching state.
   */
  #replyToRequest(requestId?: string, error?: string) {
    if (!requestId) return

    this.#sendUiMessage(error ? { requestId, ok: false, error } : { requestId, ok: true })
  }
}

export default PQ1Controller
