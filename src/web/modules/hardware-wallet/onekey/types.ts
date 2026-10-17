export type OneKeyResponse<T> =
  | { success: true; payload: T }
  | { success: false; payload: { error: string; code?: string | number } }

export type OneKeyDevice = {
  connectId: string | null
  deviceId: string | null
  deviceType: string | null
  name: string
  path?: string
}

export type OneKeyAddress = { path: string; address: string }
export type OneKeyMessageSignature = { address: string; signature: string }
export type OneKeyTransactionSignature = { v: string; r: string; s: string }

export interface OneKeyBridgeInterface {
  init: () => Promise<void>
  searchDevices: () => Promise<OneKeyResponse<OneKeyDevice[]>>
  getOnekeyFeatures: (connectId: string) => Promise<OneKeyResponse<Record<string, unknown>>>
  getPassphraseState: (connectId: string) => Promise<OneKeyResponse<string | undefined>>
  evmGetAddress: (
    connectId: string,
    deviceId: string,
    params: Record<string, unknown>
  ) => Promise<OneKeyResponse<OneKeyAddress | OneKeyAddress[]>>
  evmSignTransaction: (
    connectId: string,
    deviceId: string,
    params: Record<string, unknown>
  ) => Promise<OneKeyResponse<OneKeyTransactionSignature>>
  evmSignMessage: (
    connectId: string,
    deviceId: string,
    params: Record<string, unknown>
  ) => Promise<OneKeyResponse<OneKeyMessageSignature>>
  evmSignTypedData: (
    connectId: string,
    deviceId: string,
    params: {
      path: string
      passphraseState?: string
      metamaskV4Compat: true
      data: Record<string, unknown>
      domainHash?: string
      messageHash?: string
      chainId?: number
    }
  ) => Promise<OneKeyResponse<OneKeyMessageSignature>>
  cancel: (connectId?: string) => Promise<void>
}

export type OneKeyBridgeMethod = Exclude<keyof OneKeyBridgeInterface, 'init'>

export type OneKeyBridgeRequest = {
  target: 'ambire-onekey-offscreen'
  method: OneKeyBridgeMethod
  args: unknown[]
}

/**
 * What the offscreen document replies to a bridge request. `error` is set when the request
 * threw, which the SDK never does for device errors (those come back as unsuccessful
 * responses). So it means something unexpected went wrong, unless its `name` is
 * `ExternalSignerError`: an expected failure with a message meant for the user.
 */
export type OneKeyBridgeResponse =
  | { result: unknown }
  | { error: { message: string; name?: string; stack?: string } }
