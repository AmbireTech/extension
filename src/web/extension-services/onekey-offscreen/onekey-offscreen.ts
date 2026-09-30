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

browser.runtime.onMessage.addListener(async (request: OneKeyBridgeRequest, sender: any) => {
  if (
    request?.target !== 'ambire-onekey-offscreen' ||
    sender?.id !== browser.runtime.id ||
    sender?.tab ||
    !allowedMethods.has(request.method)
  )
    return undefined

  try {
    await bridge.init()
    const method = bridge[request.method] as (...args: unknown[]) => Promise<unknown>
    const result = await method(...request.args)
    return { result }
  } catch (error: any) {
    return { error: error?.message || 'The OneKey request failed.' }
  }
})
