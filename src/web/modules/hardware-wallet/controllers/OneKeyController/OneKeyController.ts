import { getAddress } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import OneKeyOffscreenBridge from '@web/modules/hardware-wallet/onekey/OneKeyOffscreenBridge'
import {
  OneKeyBridgeInterface,
  OneKeyDevice,
  OneKeyResponse
} from '@web/modules/hardware-wallet/onekey/types'

/**
 * OneKey SDK error codes (`HardwareErrorCode` in `@onekeyfe/hd-shared`) meaning the cached
 * connection no longer matches the plugged in device, so the device has to be looked up again.
 */
const STALE_CONNECTION_ERROR_CODES = new Set([
  105, // DeviceNotFound
  110, // DeviceCheckDeviceIdError
  112, // DeviceCheckPassphraseStateError
  901 // WebDeviceNotFoundOrNeedsPermission
])

const getIsStaleConnectionResponse = (response: OneKeyResponse<unknown>) =>
  !response.success && STALE_CONNECTION_ERROR_CODES.has(Number(response.payload.code))

const NOT_CONNECTED_MESSAGE =
  "Your OneKey isn't connected, or Ambire isn't allowed to use it. Plug it in, unlock it and try again."
const REJECTED_MESSAGE = 'The request was rejected on your OneKey.'

/**
 * Plain-language messages for the OneKey SDK error codes (`HardwareErrorCode` in
 * `@onekeyfe/hd-shared`) users run into, instead of the technical messages the SDK returns.
 */
const ERROR_MESSAGES_BY_CODE: Record<number, string> = {
  102: 'Your OneKey is in the wrong mode. Restart it and try again.', // DeviceUnexpectedMode
  105: NOT_CONNECTED_MESSAGE, // DeviceNotFound
  107: 'Your OneKey is busy with another request. Finish or cancel it on the device and try again.', // DeviceInterruptedFromOutside
  108: 'Your OneKey is in the wrong mode. Restart it and try again.', // RequiredButInBootloaderMode
  109: REJECTED_MESSAGE, // DeviceInterruptedFromUser
  110: NOT_CONNECTED_MESSAGE, // DeviceCheckDeviceIdError
  112: "The passphrase on your OneKey doesn't match this account. Enter the right passphrase and try again.", // DeviceCheckPassphraseStateError
  117: 'Your OneKey is busy with another request. Finish or cancel it on the device and try again.', // DeviceBusy
  302: "Ambire couldn't reach the OneKey service. Check your internet connection and try again.", // IFrameLoadFail
  303: "Ambire couldn't reach the OneKey service. Check your internet connection and try again.", // IframeTimeout
  407: 'Your OneKey needs a firmware update. Update it with the OneKey app and try again.', // CallMethodNeedUpgradeFirmware
  801: 'The PIN entered on your OneKey was wrong. Please try again.', // PinInvalid
  802: REJECTED_MESSAGE, // PinCancelled
  803: REJECTED_MESSAGE, // ActionCancelled
  811: 'Blind signing is turned off on your OneKey. Turn it on in the device settings to sign this request.', // BlindSignDisabled
  812: "The passphrase on your OneKey doesn't match this account. Enter the right passphrase and try again.", // UnexpectPassphrase
  822: REJECTED_MESSAGE, // CallQueueActionCancelled
  901: NOT_CONNECTED_MESSAGE // WebDeviceNotFoundOrNeedsPermission
}

const getResponsePayload = <T>(response: OneKeyResponse<T>, operation: string): T => {
  if (response.success) return response.payload

  const knownErrorMessage = ERROR_MESSAGES_BY_CODE[Number(response.payload.code)]
  if (knownErrorMessage) throw new ExternalSignerError(knownErrorMessage)

  // Not one of the errors users are expected to run into, so it's reported too
  throw new ExternalSignerError(
    response.payload.error || `Your OneKey couldn't complete the ${operation}. Please try again.`,
    { sendCrashReport: true }
  )
}

class OneKeyController implements ExternalSignerController {
  type = 'onekey'

  deviceModel = 'unknown'

  deviceId = ''

  connectId = ''

  passphraseState = ''

  unlockedPath = ''

  unlockedPathKeyAddr = ''

  isInitiated = false

  walletSDK: OneKeyBridgeInterface

  initialLoadPromise: Promise<void>

  #initializationPromise: Promise<void> | null = null

  constructor(bridge?: OneKeyBridgeInterface) {
    // The SDK forgets the device when the bridge closes it after being idle, so the next request connects again
    this.walletSDK =
      bridge || new OneKeyOffscreenBridge({ onDocumentClosed: () => this.#resetConnection() })
    this.initialLoadPromise = Promise.resolve()
  }

  async #ensureInitialized() {
    if (this.isInitiated) return
    if (!this.#initializationPromise) {
      this.#initializationPromise = this.walletSDK
        .init()
        .then(() => {
          this.isInitiated = true
        })
        .catch((error) => {
          this.#initializationPromise = null
          throw error
        })
    }

    await this.#initializationPromise
  }

  #selectDevice(devices: OneKeyDevice[], preferredDeviceId?: string): OneKeyDevice {
    const matchingDevice = preferredDeviceId
      ? devices.find(
          ({ connectId, deviceId, path }) =>
            connectId === preferredDeviceId ||
            deviceId === preferredDeviceId ||
            path === preferredDeviceId
        )
      : undefined

    if (matchingDevice) return matchingDevice
    if (devices.length === 1 && devices[0]) return devices[0]
    if (!devices.length) throw new Error('No OneKey device was found. Connect it and try again.')

    throw new Error(
      'More than one OneKey device is connected. Disconnect the others and try again.'
    )
  }

  async #setConnectedDevice(device: OneKeyDevice) {
    if (!device.connectId || !device.deviceId) {
      throw new Error(
        "Ambire couldn't identify your OneKey. Unplug it, plug it back in and try again."
      )
    }

    const features = await this.walletSDK.getOnekeyFeatures(device.connectId)
    getResponsePayload(features, 'device identification')

    const passphraseStateResponse = await this.walletSDK.getPassphraseState(device.connectId)
    this.passphraseState = getResponsePayload(passphraseStateResponse, 'passphrase') || ''
    this.connectId = device.connectId
    this.deviceId = device.deviceId
    this.deviceModel = device.name || device.deviceType || 'OneKey'
  }

  #resetConnection() {
    this.connectId = ''
    this.deviceId = ''
    this.passphraseState = ''
    this.cleanUp()
  }

  /**
   * Sends a request to the connected device. If the device was unplugged, swapped or its
   * passphrase changed since the connection was made, connects again and retries once.
   * The request reads `connectId`, `deviceId` and `passphraseState` when called, so it
   * picks up the new connection.
   */
  async callDevice<T>(request: () => Promise<OneKeyResponse<T>>): Promise<OneKeyResponse<T>> {
    if (!this.connectId || !this.deviceId) await this.connect()

    const response = await request()
    if (!getIsStaleConnectionResponse(response)) return response

    this.#resetConnection()
    await this.connect()
    return request()
  }

  async connect(preferredDeviceId?: string) {
    await this.#ensureInitialized()
    const devices = getResponsePayload(await this.walletSDK.searchDevices(), 'device search')
    await this.#setConnectedDevice(this.#selectDevice(devices, preferredDeviceId))
  }

  isUnlocked(path?: string, expectedAddress?: string) {
    if (!path || !expectedAddress) return !!this.unlockedPathKeyAddr
    return this.unlockedPath === path && this.unlockedPathKeyAddr === getAddress(expectedAddress)
  }

  async unlock(path: string, expectedAddress?: string) {
    if (!this.connectId || !this.deviceId) await this.connect()
    if (this.isUnlocked(path, expectedAddress)) return 'ALREADY_UNLOCKED' as const

    const response = await this.callDevice(() =>
      this.walletSDK.evmGetAddress(this.connectId, this.deviceId, {
        path,
        passphraseState: this.passphraseState,
        showOnOneKey: false
      })
    )
    const payload = getResponsePayload(response, 'address')
    if (Array.isArray(payload))
      throw new Error("Your OneKey didn't return a valid address. Please try again.")

    if (expectedAddress && getAddress(payload.address) !== getAddress(expectedAddress)) {
      throw new ExternalSignerError(
        "This OneKey, or the passphrase entered on it, doesn't hold the key for this account. Connect the right device or passphrase and try again."
      )
    }

    this.unlockedPath = path
    this.unlockedPathKeyAddr = getAddress(payload.address)
    return 'JUST_UNLOCKED' as const
  }

  async retrieveAddresses(paths: string[]) {
    const response = await this.callDevice(() =>
      this.walletSDK.evmGetAddress(this.connectId, this.deviceId, {
        bundle: paths.map((path) => ({
          path,
          passphraseState: this.passphraseState,
          showOnOneKey: false
        }))
      })
    )
    const payload = getResponsePayload(response, 'address')
    const addresses = Array.isArray(payload) ? payload : [payload]
    if (addresses.length !== paths.length) {
      throw new Error("Your OneKey didn't return all the requested addresses. Please try again.")
    }

    return addresses.map(({ address }) => getAddress(address))
  }

  cleanUp() {
    this.unlockedPath = ''
    this.unlockedPathKeyAddr = ''
  }

  async signingCleanup() {
    await this.walletSDK.cancel(this.connectId || undefined)
  }
}

export { getResponsePayload }
export default OneKeyController
