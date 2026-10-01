import { browser } from '@web/constants/browserapi'
import { captureBackgroundException } from '@web/extension-services/background/CrashAnalytics'

import {
  OneKeyBridgeInterface,
  OneKeyBridgeMethod,
  OneKeyBridgeRequest,
  OneKeyBridgeResponse
} from './types'

const OFFSCREEN_DOCUMENT_PATH = 'onekey-offscreen.html'

const NO_RESPONSE_MESSAGE = "Ambire couldn't reach your OneKey. Reconnect it and try again."

class OneKeyOffscreenBridge implements OneKeyBridgeInterface {
  #ensuringDocument: Promise<void> | null = null

  async #hasOneKeyDocument(offscreen: any) {
    const getContexts = (globalThis as any).chrome?.runtime?.getContexts
    // Older browsers can't tell which offscreen document exists, only that one does
    if (!getContexts) return offscreen.hasDocument()

    const contexts = await getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [browser.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
    })
    return contexts.length > 0
  }

  async #createDocumentIfMissing() {
    const offscreen = (globalThis as any).chrome?.offscreen
    if (!offscreen) throw new Error('OneKey is not supported by this browser.')

    if (await this.#hasOneKeyDocument(offscreen)) return

    await offscreen.createDocument({
      url: browser.runtime.getURL(OFFSCREEN_DOCUMENT_PATH),
      reasons: ['IFRAME_SCRIPTING'],
      justification: 'Connect to a OneKey hardware wallet through its isolated SDK iframe.'
    })
  }

  // The check and the creation run as one step, so requests that start together share it
  // instead of both trying to create the document (the browser allows only one).
  #ensureDocument() {
    if (!this.#ensuringDocument) {
      this.#ensuringDocument = this.#createDocumentIfMissing().finally(() => {
        this.#ensuringDocument = null
      })
    }

    return this.#ensuringDocument
  }

  async #call<T>(method: OneKeyBridgeMethod, args: unknown[]): Promise<T> {
    await this.#ensureDocument()
    const request: OneKeyBridgeRequest = { target: 'ambire-onekey-offscreen', method, args }
    const response: OneKeyBridgeResponse | undefined = await browser.runtime.sendMessage(request)

    if (response && 'error' in response) {
      const error = new Error(response.error.message)
      if (response.error.name) error.name = response.error.name
      if (response.error.stack) error.stack = response.error.stack
      captureBackgroundException(error)
      throw error
    }
    if (!response || !Object.prototype.hasOwnProperty.call(response, 'result')) {
      const error = new Error(NO_RESPONSE_MESSAGE)
      captureBackgroundException(new Error(`The OneKey offscreen document didn't answer ${method}`))
      throw error
    }
    return response.result as T
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
