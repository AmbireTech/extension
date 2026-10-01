import { browser } from '@web/constants/browserapi'
import { OneKeyBridgeRequest } from '@web/modules/hardware-wallet/onekey/types'

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

const handleBridgeRequest = async (request: OneKeyBridgeRequest) => {
  try {
    await bridge.init()
    const method = bridge[request.method] as (...args: unknown[]) => Promise<unknown>
    const result = await method(...request.args)
    return { result }
  } catch (error: any) {
    return { error: error?.message || 'The OneKey request failed.' }
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
