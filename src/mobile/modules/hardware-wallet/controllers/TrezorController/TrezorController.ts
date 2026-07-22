import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import {
  getMessageFromTrezorErrorCode,
  getTrezorErrorMessageFromPayload
} from '@ambire-common/libs/trezor/trezor'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import {
  TrezorControllerInterface,
  TrezorWalletSDK
} from '@common/modules/hardware-wallet/interfaces/trezorController'

// Mobile counterpart of the web TrezorController. The actual device handling is
// delegated to the Trezor Suite app via deep links, driven from the React
// Native native context (see src/mobile/services/trezor/trezorDeeplinkService).
// This controller runs inside the WebView worker bundle alongside the rest of
// the ambire-common controllers; its `walletSDK` is a shim that forwards each
// Trezor Connect call to the native service over the bridge (`sendToRNAsync`),
// returning the raw `{ success, payload }` response the shared TrezorSigner /
// TrezorKeyIterator expect.

const callNative = <T>(type: string, payload: Record<string, any> = {}): Promise<T> => {
  // sendToRNAsync is installed on `window` by injectedLogic.ts. The controller
  // only ever runs inside the worker, so it is always present here.
  return (window as any).sendToRNAsync(type, payload)
}

class TrezorController implements ExternalSignerController, TrezorControllerInterface {
  type = 'trezor'

  unlockedPath: string = ''

  unlockedPathKeyAddr: string = ''

  deviceModel = 'unknown'

  deviceId = ''

  /**
   * The native service initializes @trezor/connect-mobile lazily on the first
   * call, so from the worker's perspective the SDK is always ready to be called.
   */
  isInitiated = true

  initialLoadPromise = Promise.resolve()

  /**
   * Bridge shim: each method forwards the Trezor Connect call to the native
   * service and resolves with the raw `{ success, payload }` response. The SDK
   * methods are overloaded, so the object is cast to the interface once here;
   * the real type-checking of arguments happens where TrezorSigner /
   * TrezorKeyIterator call `controller.walletSDK.*` (typed via the interface).
   */
  walletSDK: TrezorWalletSDK = {
    ethereumGetAddress: (params: any) => callNative('trezor.ethereumGetAddress', params),
    getPublicKey: (params: any) => callNative('trezor.getPublicKey', params),
    ethereumSignTransaction: (params: any) => callNative('trezor.ethereumSignTransaction', params),
    ethereumSignTypedData: (params: any) => callNative('trezor.ethereumSignTypedData', params),
    ethereumSignMessage: (params: any) => callNative('trezor.ethereumSignMessage', params)
  } as unknown as TrezorWalletSDK

  cleanUp() {
    this.unlockedPath = ''
    this.unlockedPathKeyAddr = ''
  }

  async signingCleanup() {
    await callNative('trezor.signingCleanup')
  }

  isUnlocked(path?: string, expectedKeyOnThisPath?: string) {
    // If no path or expected key is provided, just check if there is any
    // unlocked path, that's a valid case when retrieving accounts for import.
    if (!path || !expectedKeyOnThisPath) {
      return !!(this.unlockedPath && this.unlockedPathKeyAddr)
    }

    // Make sure it's unlocked with the right path and with the right key,
    // otherwise - treat as not unlocked.
    return this.unlockedPathKeyAddr === expectedKeyOnThisPath && this.unlockedPath === path
  }

  async unlock(path: ReturnType<typeof getHdPathFromTemplate>, expectedKeyOnThisPath?: string) {
    if (this.isUnlocked(path, expectedKeyOnThisPath)) {
      return 'ALREADY_UNLOCKED' as const
    }

    const response = await this.walletSDK.ethereumGetAddress({
      path,
      // Do not pass `address` for on-device validation: a mismatch surfaces an
      // unfriendly "Addresses do not match" error inside Suite (mirrors the web
      // controller, which relies on post-signing validation instead).
      showOnTrezor: false
    })

    if (!response.success) {
      throw new ExternalSignerError(
        getMessageFromTrezorErrorCode(
          response.payload.code,
          getTrezorErrorMessageFromPayload(response.payload)
        )
      )
    }

    this.unlockedPath = response.payload.serializedPath
    this.unlockedPathKeyAddr = response.payload.address

    return 'JUST_UNLOCKED' as const
  }
}

export default TrezorController
