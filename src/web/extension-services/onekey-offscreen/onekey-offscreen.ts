import { browser } from '@web/constants/browserapi'
import {
  OneKeyBridgeRequest,
  OneKeyBridgeResponse
} from '@web/modules/hardware-wallet/onekey/types'

import OneKeySdkBridge from './oneKeySdkBridge'

const bridge = new OneKeySdkBridge()
const allowedMethods = new Set([
  'searchDevices',
  'getOnekeyFeatures',
  'getPassphraseState',
  'evmGetAddress',
  'evmSignTransaction',
  'evmSignMessage',
  'evmSignTypedData',
  'cancel'
])

const handleBridgeRequest = async (request: OneKeyBridgeRequest): Promise<OneKeyBridgeResponse> => {
  try {
    await bridge.init()
    const method = bridge[request.method] as (...args: unknown[]) => Promise<unknown>
    const result = await method(...request.args)
    return { result }
  } catch (error: any) {
    // Sentry isn't set up in this document, so the background reports the error it gets back
    console.error(`OneKey bridge: ${request.method} failed`, error)
    return {
      error: {
        message: error?.message || 'The OneKey request failed.',
        name: error?.name,
        stack: error?.stack
      }
    }
  }
}

// The listener must not be `async`: returning a promise answers the message, so this document
// would answer every other runtime message (like the UI ping to the background) with `undefined`.
browser.runtime.onMessage.addListener((request: OneKeyBridgeRequest, sender: any) => {
  if (
    request?.target !== 'ambire-onekey-offscreen' ||
    sender?.id !== browser.runtime.id ||
    sender?.tab ||
    !allowedMethods.has(request.method)
  )
    return undefined

  return handleBridgeRequest(request)
})
