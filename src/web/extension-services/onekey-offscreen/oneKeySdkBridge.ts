import HardwareSDK from '@onekeyfe/hd-web-sdk'
import { UI_EVENT, UI_REQUEST, UI_RESPONSE } from '@onekeyfe/hd-core'

import { OneKeyBridgeInterface } from '@web/modules/hardware-wallet/onekey/types'

const { HardwareWebSdk } = HardwareSDK

class OneKeySdkBridge implements OneKeyBridgeInterface {
  #initPromise: Promise<void> | null = null

  async init() {
    if (this.#initPromise) return this.#initPromise

    this.#initPromise = (async () => {
      HardwareWebSdk.on(UI_EVENT, (event: { type: string }) => {
        if (event.type === UI_REQUEST.REQUEST_PIN) {
          HardwareWebSdk.uiResponse({
            type: UI_RESPONSE.RECEIVE_PIN,
            payload: '@@ONEKEY_INPUT_PIN_IN_DEVICE'
          })
        }

        if (event.type === UI_REQUEST.REQUEST_PASSPHRASE) {
          HardwareWebSdk.uiResponse({
            type: UI_RESPONSE.RECEIVE_PASSPHRASE,
            payload: { value: '', passphraseOnDevice: true, save: true }
          })
        }
      })

      await HardwareWebSdk.init({
        debug: false,
        connectSrc: 'https://jssdk.onekey.so/1.1.0/',
        env: 'webusb'
      })
    })()

    return this.#initPromise
  }

  searchDevices: OneKeyBridgeInterface['searchDevices'] = () => HardwareWebSdk.searchDevices()

  getOnekeyFeatures: OneKeyBridgeInterface['getOnekeyFeatures'] = (connectId) =>
    HardwareWebSdk.getOnekeyFeatures(connectId)

  getPassphraseState: OneKeyBridgeInterface['getPassphraseState'] = (connectId) =>
    HardwareWebSdk.getPassphraseState(connectId)

  evmGetAddress: OneKeyBridgeInterface['evmGetAddress'] = (connectId, deviceId, params) =>
    HardwareWebSdk.evmGetAddress(connectId, deviceId, params as any) as ReturnType<
      OneKeyBridgeInterface['evmGetAddress']
    >

  evmSignTransaction: OneKeyBridgeInterface['evmSignTransaction'] = (connectId, deviceId, params) =>
    HardwareWebSdk.evmSignTransaction(connectId, deviceId, params as any)

  evmSignMessage: OneKeyBridgeInterface['evmSignMessage'] = (connectId, deviceId, params) =>
    HardwareWebSdk.evmSignMessage(connectId, deviceId, params as any)

  evmSignTypedData: OneKeyBridgeInterface['evmSignTypedData'] = (connectId, deviceId, params) =>
    HardwareWebSdk.evmSignTypedData(connectId, deviceId, params as any)

  cancel: OneKeyBridgeInterface['cancel'] = async (connectId) => {
    HardwareWebSdk.cancel(connectId)
  }
}

export default OneKeySdkBridge
