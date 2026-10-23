import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'

import { SW_OK, SW_SECURITY_CONDITION } from '../../libs/pq1/config'
import { toUserFacingPq1Error } from '../../libs/pq1/errors'
import { DeviceCommands, type DeviceStatus } from '../../libs/pq1/transport/commands'
import { HidTransport } from '../../libs/pq1/transport/hid'

/**
 * Owns the WebHID connection to one PQ1 and implements Ambire's
 * `ExternalSignerController`, so the keystore treats it like any other
 * hardware wallet controller.
 *
 * PQ1 has no BIP-32 derivation: the device holds 256 numbered accounts, each
 * its own PQSmartWallet, and `PQ1Signer` addresses them by number.
 *
 * Two instances exist. The connect screen makes its own, because opening a
 * new device needs a user gesture, and releases it once the accounts are
 * imported. The background's instance re-opens the already-permitted device
 * when the first signature needs it, then keeps it open while the service
 * worker lives (a replug or a dead handle reconnects on the next `unlock()`).
 * Keeping it open also keeps `DeviceCommands`' init-code cache, which saves
 * the device a bootstrap-key signature on every retried first deployment.
 *
 * There is no `signingCleanup`: a PQ1 sign command is one-shot, with no
 * session to reset, and an unwanted request is rejected on the device.
 */
class PQ1Controller implements ExternalSignerController {
  type = 'pq1'

  deviceModel = 'pq1'

  /** Identifies the device: the first 6 bytes of its account 0 address. Set
   *  by `unlock()`, cleared when the device goes away. */
  deviceId = ''

  walletSDK: { transport: HidTransport; commands: DeviceCommands } | null = null

  /** Optional UI hook: set by screens that hold this controller (e.g. the
   *  connect screen) to react when the device is physically unplugged. */
  onDeviceDisconnect?: () => void

  isUnlocked() {
    return this.walletSDK !== null && this.walletSDK.transport.isConnected() && !!this.deviceId
  }

  /** Wired as `HidTransport.onDisconnect`. The transport has already torn
   *  itself down and failed in-flight reads — drop our stale handle so the
   *  next unlock() reconnects from scratch instead of writing into a void. */
  #handleUnplug = () => {
    this.walletSDK = null
    this.deviceId = ''
    this.onDeviceDisconnect?.()
  }

  /**
   * Idempotent and self-healing: probes an existing handle with the ungated
   * GET_STATUS (a stale handle after unplug/replug or a service-worker
   * restart fails the probe and triggers a clean reconnect). Otherwise pop
   * the WebHID picker, open the device, run GET_STATUS, and if the firmware
   * reports `locked` (initial state or 2-minute idle re-lock) issue an
   * UNLOCK APDU — which triggers PIN entry on the device. The promise
   * resolves once the user has authenticated on-device.
   */
  async unlock(): Promise<'ALREADY_UNLOCKED' | 'JUST_UNLOCKED'> {
    let status: DeviceStatus | null = null
    if (this.walletSDK) {
      try {
        status = await this.walletSDK.commands.getStatus()
      } catch (e) {
        // Dead handle — release it fully; the reconnect below starts fresh.
        console.warn('[pq1] existing device handle is stale, reconnecting', e)
        await this.cleanUp()
      }
    }

    let freshlyConnected = false
    if (!this.walletSDK) {
      const transport = new HidTransport()
      try {
        await transport.connect()
      } catch (e) {
        throw toUserFacingPq1Error(
          e,
          "Couldn't connect to the PQ1. Plug it in with the USB cable and try again."
        )
      }
      transport.onDisconnect = this.#handleUnplug
      const commands = new DeviceCommands(transport)
      this.walletSDK = { transport, commands }
      status = null
      freshlyConnected = true
    }

    const { commands } = this.walletSDK
    let didPinUnlock = false
    try {
      // GET_STATUS carries no `provisioned` flag (see DeviceStatus). A blank
      // device shows its first-boot wizard and refuses gated commands with
      // 0x6985 while reporting `locked: false`, which is handled below.
      if ((status ?? (await commands.getStatus())).locked) {
        // INS_UNLOCK blocks until the user enters the PIN on the device (or
        // gives up). The transport timeout for this INS is 60 s.
        const sw = await commands.unlock()
        if (sw !== SW_OK) {
          // 0x6982 covers both "wrong PIN" and "user rejected the PIN
          // prompt" — either way it was an on-device decision, so surface
          // it plainly and never auto-retry.
          if (sw === SW_SECURITY_CONDITION) {
            throw new ExternalSignerError(
              'The PIN entry was cancelled, or the PIN was wrong. Unlock the PQ1 and try again.',
              { sendCrashReport: false }
            )
          }
          throw toUserFacingPq1Error(
            new Error(`PQ1 unlock refused: SW=0x${sw.toString(16).padStart(4, '0')}`)
          )
        }
        didPinUnlock = true
      }

      // The `deviceId` the keystore tags external keys with. GET_DEVICE_INFO
      // can't provide one: its leading bytes are the protocol version, a
      // placeholder firmware version and a still-unset device UID, the same
      // on every PQ1. Account 0's wallet address is derived from the
      // device's own seed, so it tells two PQ1s apart. Skipped when already
      // cached so the pre-signing unlock() probe stays a single GET_STATUS
      // round trip.
      if (!this.deviceId) {
        this.deviceId = toShortDeviceId(await commands.getWalletAddress(0))
      }
    } catch (e) {
      throw toUserFacingPq1Error(e)
    }

    return freshlyConnected || didPinUnlock ? 'JUST_UNLOCKED' : 'ALREADY_UNLOCKED'
  }

  /** Close the WebHID handle and forget the device. Never rejects: a failed
   *  close is logged, and the state is reset either way. */
  async cleanUp() {
    if (this.walletSDK) {
      try {
        await this.walletSDK.transport.disconnect()
      } catch (e) {
        // Nothing left to release — the state below is reset either way.
        console.warn('[pq1] disconnecting the device failed', e)
      }
    }
    this.walletSDK = null
    this.deviceId = ''
  }
}

/** Lower-hex of the first 6 bytes of account 0's address — keeps the
 *  keystore meta.deviceId field short while still telling devices apart. */
function toShortDeviceId(account0Address: `0x${string}`): string {
  return account0Address.slice(2, 14).toLowerCase()
}

export default PQ1Controller
