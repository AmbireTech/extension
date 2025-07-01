import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import { WindowManager } from '@ambire-common/interfaces/window'
import { getMessageFromTrezorErrorCode } from '@ambire-common/libs/trezor/trezor'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import trezorConnect, { TrezorConnect } from '@trezor/connect-webextension'

export type {
  EthereumTransaction,
  EthereumTransactionEIP1559,
  TrezorConnect
} from '@trezor/connect-webextension'

const TREZOR_CONNECT_MANIFEST = {
  email: 'wallet@ambire.com',
  appUrl: 'https://ambire.com',
  appName: 'Ambire',
  appIcon: 'https://www.ambire.com/ambire-trezor-connect-icon-light.png'
}

class TrezorController implements ExternalSignerController {
  type = 'trezor'

  unlockedPath: string = ''

  unlockedPathKeyAddr: string = ''

  deviceModel = 'unknown'

  deviceId = ''

  walletSDK: TrezorConnect = trezorConnect

  // Trezor SDK gets initiated once (upon extension start) and never unloaded
  isInitiated = false

  // Holds the initial load promise, so that one can wait until it completes
  initialLoadPromise

  #windowManager: WindowManager

  constructor(windowManager: WindowManager) {
    this.#windowManager = windowManager

    this.walletSDK.on('DEVICE_EVENT', (event: any) => {
      if (event?.payload?.name) {
        this.deviceModel = event.payload.name.replace(/^Trezor\s*/, '').trim()
      }

      if (event?.payload?.id) {
        this.deviceId = event.payload.id
      }
    })

    this.initialLoadPromise = this.#init()
  }

  async #init() {
    try {
      await this.walletSDK.init({ manifest: TREZOR_CONNECT_MANIFEST, lazyLoad: true, popup: true })
      this.isInitiated = true
    } catch (error) {
      console.error('TrezorController: failed to init the Trezor SDK', error)
    }
  }

  cleanUp() {
    this.unlockedPath = ''
    this.unlockedPathKeyAddr = ''
  }

  async signingCleanup() {
    try {
      await this.#windowManager.closePopupWithUrl('https://connect.trezor.io/9/popup.html')
    } catch (e) {
      console.error('Error while removing Trezor window', e)
    }
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
      return 'ALREADY_UNLOCKED'
    }

    const response = await this.walletSDK.ethereumGetAddress({
      path,
      // Do not use this validation option, because if the expected key is not
      // on this path, the Trezor displays a not very user friendly error
      // "Addresses do not match" in the Trezor popup. That might cause
      // confusion. And we can't display a better message until the user
      // closes the Trezor popup and we get the response from the Trezor.
      // address: expectedKeyOnThisPath,
      showOnTrezor: false // prioritize having less steps for the user
    })

    if (!response.success) {
      throw new ExternalSignerError(
        getMessageFromTrezorErrorCode(response.payload.code, response.payload.error)
      )
    }

    this.unlockedPath = response.payload.serializedPath
    this.unlockedPathKeyAddr = response.payload.address

    return 'JUST_UNLOCKED'
  }
}

export default TrezorController
