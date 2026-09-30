import { browser } from '@web/constants/browserapi'

import { OneKeyBridgeInterface, OneKeyBridgeMethod, OneKeyBridgeRequest } from './types'

const OFFSCREEN_DOCUMENT_PATH = 'onekey-offscreen.html'

class OneKeyOffscreenBridge implements OneKeyBridgeInterface {
  #creatingDocument: Promise<void> | null = null

  async #ensureDocument() {
    const offscreen = (globalThis as any).chrome?.offscreen
    if (!offscreen) throw new Error('OneKey is not supported by this browser.')

    if (await offscreen.hasDocument()) return
    if (this.#creatingDocument) return this.#creatingDocument

    this.#creatingDocument = offscreen
      .createDocument({
        url: browser.runtime.getURL(OFFSCREEN_DOCUMENT_PATH),
        reasons: ['IFRAME_SCRIPTING'],
        justification: 'Connect to a OneKey hardware wallet through its isolated SDK iframe.'
      })
      .finally(() => {
        this.#creatingDocument = null
      })

    return this.#creatingDocument
  }

  async #call<T>(method: OneKeyBridgeMethod, args: unknown[]): Promise<T> {
    await this.#ensureDocument()
    const request: OneKeyBridgeRequest = { target: 'ambire-onekey-offscreen', method, args }
    const response = await browser.runtime.sendMessage(request)

    if (response?.error) throw new Error(response.error)
    if (!response || !Object.prototype.hasOwnProperty.call(response, 'result')) {
      throw new Error('The isolated OneKey bridge did not respond.')
    }
    return response?.result as T
  }

  async init() {
    await this.#ensureDocument()
  }

  searchDevices: OneKeyBridgeInterface['searchDevices'] = () => this.#call('searchDevices', [])

  getOnekeyFeatures: OneKeyBridgeInterface['getOnekeyFeatures'] = (connectId) =>
    this.#call('getOnekeyFeatures', [connectId])

  getPassphraseState: OneKeyBridgeInterface['getPassphraseState'] = (connectId) =>
    this.#call('getPassphraseState', [connectId])

  evmGetAddress: OneKeyBridgeInterface['evmGetAddress'] = (connectId, deviceId, params) =>
    this.#call('evmGetAddress', [connectId, deviceId, params])

  evmSignTransaction: OneKeyBridgeInterface['evmSignTransaction'] = (connectId, deviceId, params) =>
    this.#call('evmSignTransaction', [connectId, deviceId, params])

  evmSignMessage: OneKeyBridgeInterface['evmSignMessage'] = (connectId, deviceId, params) =>
    this.#call('evmSignMessage', [connectId, deviceId, params])

  evmSignTypedData: OneKeyBridgeInterface['evmSignTypedData'] = (connectId, deviceId, params) =>
    this.#call('evmSignTypedData', [connectId, deviceId, params])

  cancel: OneKeyBridgeInterface['cancel'] = async (connectId) => {
    await this.#call('cancel', [connectId])
  }
}

export default OneKeyOffscreenBridge
