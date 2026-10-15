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
import trezorDeeplinkService from '@mobile/services/trezor/trezorDeeplinkService'

// Mobile counterpart of the web TrezorController. The actual device handling is
// delegated to the Trezor Suite app via deep links, driven by
// trezorDeeplinkService (@trezor/connect-mobile). Its `walletSDK` is that
// service, which returns the raw `{ success, payload }` Trezor Connect response
// the shared TrezorSigner / TrezorKeyIterator expect.

class TrezorController implements ExternalSignerController, TrezorControllerInterface {
  type = 'trezor'

  unlockedPath: string = ''

  unlockedPathKeyAddr: string = ''

  deviceModel = 'unknown'

  deviceId = ''

  /**
   * The service initializes @trezor/connect-mobile lazily on the first call, so
   * the SDK is always ready to be called.
   */
  isInitiated = true

  initialLoadPromise = Promise.resolve()

  /**
   * The Trezor Connect SDK methods are overloaded, so the service is cast to the
   * interface once here; the real type-checking of arguments happens where
   * TrezorSigner / TrezorKeyIterator call `controller.walletSDK.*` (typed via
   * the interface).
   */
  walletSDK: TrezorWalletSDK = trezorDeeplinkService as unknown as TrezorWalletSDK

  cleanUp() {
    this.unlockedPath = ''
    this.unlockedPathKeyAddr = ''
  }

  async signingCleanup() {
    await trezorDeeplinkService.signingCleanup()
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
