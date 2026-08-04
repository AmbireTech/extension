import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { NfcWalletType } from '@ambire-common/interfaces/keystore'
import { NfcControllerInterface } from '@common/modules/hardware-wallets/nfc/interfaces/nfcController'
import {
  NfcControllerSignHashParams,
  NfcSignature
} from '@common/modules/hardware-wallets/nfc/types'

// Worker-side counterpart of the native card services. It runs inside the WebView
// worker bundle alongside the rest of the controllers and forwards signing to the
// React Native context over the message bridge, because the NFC radio is not
// reachable from the worker.
//
// The controller is card-agnostic: the card to talk to travels with every request
// (`nfcWalletType`) and the bridge hands it to that card's native service.
//
// The PIN is deliberately absent here: the native service collects it straight
// from the UI, so it never crosses the bridge.
const callNative = <T>(type: string, payload: Record<string, any> = {}): Promise<T> => {
  // sendToRNAsync is installed on `window` by injectedLogic.ts. The controller
  // only ever runs inside the worker, so it is always present here.
  return (window as any).sendToRNAsync(type, payload)
}

class NfcController implements NfcControllerInterface {
  type = 'nfc'

  // Which card is in use: set by the key iterator on import and by every signing
  // request afterwards. It lands in the key meta, so signing can pick the card the
  // account was imported with.
  nfcWalletType?: NfcWalletType

  // The card's name, set by the key iterator on import, so it lands in the key meta.
  deviceModel = ''

  // The id of the wallet on the card the accounts were imported from. Set by the
  // key iterator on import, so it lands in the key meta as the device id.
  deviceId = ''

  isUnlocked = () => true

  unlock = async () => 'ALREADY_UNLOCKED' as const

  unlockedPath = ''

  unlockedPathKeyAddr = ''

  async signHash(args: NfcControllerSignHashParams): Promise<NfcSignature> {
    this.nfcWalletType = args.nfcWalletType

    try {
      return await callNative<NfcSignature>('nfc.signHash', args)
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'Signing with the card failed.')
    }
  }

  async signingCleanup() {
    await this.#cancelCardSession()
  }

  cleanUp = async () => {
    await this.#cancelCardSession()
  }

  // Nothing to cancel before a card has been used - there is no session to end and
  // no way to tell which card's service should be asked to end one.
  #cancelCardSession = async () => {
    if (!this.nfcWalletType) return

    await callNative('nfc.cancel', { nfcWalletType: this.nfcWalletType })
  }
}

export default NfcController
