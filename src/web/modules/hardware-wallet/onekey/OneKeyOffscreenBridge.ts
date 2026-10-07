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

/**
 * How long the offscreen document, and the OneKey SDK iframe it loads from OneKey's servers,
 * stays open after the last request. Closing it right after each request would reload the
 * iframe (and ask for the passphrase again) on every step of a flow like importing accounts.
 */
const IDLE_CLOSE_DELAY_MS = 2 * 60 * 1000

type OneKeyOffscreenBridgeOptions = {
  /** Called after the document is closed, since the OneKey SDK forgets the connected device with it */
  onDocumentClosed?: () => void
}

class OneKeyOffscreenBridge implements OneKeyBridgeInterface {
  #ensuringDocument: Promise<void> | null = null

  #closingDocument: Promise<void> | null = null

  #pendingRequestsCount = 0

  #idleCloseTimeout: ReturnType<typeof setTimeout> | null = null

  #onDocumentClosed?: () => void

  constructor({ onDocumentClosed }: OneKeyOffscreenBridgeOptions = {}) {
    this.#onDocumentClosed = onDocumentClosed
    // The document outlives a background restart, so one left open from before gets closed too
    this.#scheduleIdleClose()
  }

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

    // Otherwise the document could pass the check below and be gone right after it
    if (this.#closingDocument) await this.#closingDocument
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

  async #closeDocumentIfUnused() {
    const offscreen = (globalThis as any).chrome?.offscreen
    if (!offscreen || !(await this.#hasOneKeyDocument(offscreen))) return
    // A request may have started while checking for the document
    if (this.#pendingRequestsCount) return

    await offscreen.closeDocument()
    this.#onDocumentClosed?.()
  }

  #closeDocument() {
    this.#idleCloseTimeout = null
    if (this.#pendingRequestsCount || this.#closingDocument) return

    this.#closingDocument = this.#closeDocumentIfUnused()
      .catch((error) => {
        // Nothing waits for the close, so a failure only means the document stays open
        console.error('OneKey bridge: closing the offscreen document failed', error)
        captureBackgroundException(error)
      })
      .finally(() => {
        this.#closingDocument = null
      })
  }

  #scheduleIdleClose() {
    if (this.#idleCloseTimeout) clearTimeout(this.#idleCloseTimeout)
    this.#idleCloseTimeout = setTimeout(() => this.#closeDocument(), IDLE_CLOSE_DELAY_MS)
  }

  /**
   * Opens the document for the request and keeps it open until every request finishes,
   * then closes it if no other request comes in for `IDLE_CLOSE_DELAY_MS`.
   */
  async #withDocument<T>(request: () => Promise<T>): Promise<T> {
    this.#pendingRequestsCount++
    try {
      await this.#ensureDocument()
      return await request()
    } finally {
      this.#pendingRequestsCount--
      if (!this.#pendingRequestsCount) this.#scheduleIdleClose()
    }
  }

  async #getIsDocumentInUse() {
    if (this.#pendingRequestsCount) return true

    const offscreen = (globalThis as any).chrome?.offscreen
    if (!offscreen || this.#closingDocument) return false
    return this.#hasOneKeyDocument(offscreen)
  }

  #call<T>(method: OneKeyBridgeMethod, args: unknown[]): Promise<T> {
    return this.#withDocument(async () => {
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
        captureBackgroundException(
          new Error(`The OneKey offscreen document didn't answer ${method}`)
        )
        throw error
      }
      return response.result as T
    })
  }

  async init() {
    await this.#withDocument(async () => {})
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

  // Without an open document there's nothing to cancel, so it isn't opened (loading the SDK) just for this
  cancel: OneKeyBridgeInterface['cancel'] = async (connectId) => {
    if (!(await this.#getIsDocumentInUse())) return
    await this.#call('cancel', [connectId])
  }
}

export default OneKeyOffscreenBridge
