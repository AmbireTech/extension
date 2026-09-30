import { getAddress } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import OneKeyOffscreenBridge from '@web/modules/hardware-wallet/onekey/OneKeyOffscreenBridge'
import {
  OneKeyBridgeInterface,
  OneKeyDevice,
  OneKeyResponse
} from '@web/modules/hardware-wallet/onekey/types'

const getResponsePayload = <T>(response: OneKeyResponse<T>, operation: string): T => {
  if (response.success) return response.payload
  throw new ExternalSignerError(response.payload.error || `The OneKey ${operation} request failed.`)
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

  constructor(bridge: OneKeyBridgeInterface = new OneKeyOffscreenBridge()) {
    this.walletSDK = bridge
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
          ({ connectId, deviceId }) =>
            connectId === preferredDeviceId || deviceId === preferredDeviceId
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
      throw new Error('The OneKey device did not provide a valid connection identity.')
    }

    const features = await this.walletSDK.getOnekeyFeatures(device.connectId)
    getResponsePayload(features, 'device identification')

    const passphraseStateResponse = await this.walletSDK.getPassphraseState(device.connectId)
    this.passphraseState = getResponsePayload(passphraseStateResponse, 'passphrase') || ''
    this.connectId = device.connectId
    this.deviceId = device.deviceId
    this.deviceModel = device.name || device.deviceType || 'OneKey'
  }

  async connect(preferredDeviceId?: string) {
    await this.#ensureInitialized()

    const devices = getResponsePayload(await this.walletSDK.searchDevices(), 'device search')
    await this.#setConnectedDevice(this.#selectDevice(devices, preferredDeviceId))
  }

  /**
   * Detection for the Trezor compatibility recovery path. A successful proprietary
   * getOnekeyFeatures call is required before this method identifies the device as OneKey.
   */
  async connectFromTrezor(
    trezorDeviceId: string,
    path: string,
    expectedAddress: string
  ): Promise<boolean> {
    try {
      await this.#ensureInitialized()

      const devicesResponse = await this.walletSDK.searchDevices()
      if (!devicesResponse.success) return false
      const device = this.#selectDevice(devicesResponse.payload, trezorDeviceId)
      if (!device.connectId || !device.deviceId) return false

      // This proprietary request is the positive OneKey identification signal.
      const features = await this.walletSDK.getOnekeyFeatures(device.connectId)
      if (!features.success) return false

      const passphraseStateResponse = await this.walletSDK.getPassphraseState(device.connectId)
      if (!passphraseStateResponse.success) return false
      const addressResponse = await this.walletSDK.evmGetAddress(
        device.connectId,
        device.deviceId,
        {
          path,
          passphraseState: passphraseStateResponse.payload,
          showOnOneKey: false
        }
      )
      if (!addressResponse.success || Array.isArray(addressResponse.payload)) return false
      if (getAddress(addressResponse.payload.address) !== getAddress(expectedAddress)) return false

      this.passphraseState = passphraseStateResponse.payload || ''
      this.connectId = device.connectId
      this.deviceId = device.deviceId
      this.deviceModel = device.name || device.deviceType || 'OneKey'
      this.unlockedPath = path
      this.unlockedPathKeyAddr = getAddress(addressResponse.payload.address)
      return true
    } catch {
      return false
    }
  }

  isUnlocked(path?: string, expectedAddress?: string) {
    if (!path || !expectedAddress) return !!this.unlockedPathKeyAddr
    return this.unlockedPath === path && this.unlockedPathKeyAddr === getAddress(expectedAddress)
  }

  async unlock(path: string, expectedAddress?: string) {
    if (!this.connectId || !this.deviceId) await this.connect()
    if (this.isUnlocked(path, expectedAddress)) return 'ALREADY_UNLOCKED' as const

    const response = await this.walletSDK.evmGetAddress(this.connectId, this.deviceId, {
      path,
      passphraseState: this.passphraseState,
      showOnOneKey: false
    })
    const payload = getResponsePayload(response, 'address')
    if (Array.isArray(payload)) throw new Error('The OneKey device returned an invalid address.')

    if (expectedAddress && getAddress(payload.address) !== getAddress(expectedAddress)) {
      throw new ExternalSignerError(
        'The connected OneKey device or passphrase does not match the key selected for signing.'
      )
    }

    this.unlockedPath = path
    this.unlockedPathKeyAddr = getAddress(payload.address)
    return 'JUST_UNLOCKED' as const
  }

  async retrieveAddresses(paths: string[]) {
    if (!this.connectId || !this.deviceId) await this.connect()

    const response = await this.walletSDK.evmGetAddress(this.connectId, this.deviceId, {
      bundle: paths.map((path) => ({
        path,
        passphraseState: this.passphraseState,
        showOnOneKey: false
      }))
    })
    const payload = getResponsePayload(response, 'address')
    const addresses = Array.isArray(payload) ? payload : [payload]
    if (addresses.length !== paths.length) {
      throw new Error('The OneKey device returned an unexpected number of addresses.')
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
