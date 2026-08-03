import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { NfcWalletType } from '@ambire-common/interfaces/keystore'
import { NfcControllerInterface } from '@common/modules/hardware-wallets/nfc/interfaces/nfcController'
import { NfcSignature } from '@common/modules/hardware-wallets/nfc/types'

// Worker-side counterpart of the native keycardNfcService. It runs inside the
// WebView worker bundle alongside the rest of the controllers and forwards
// signing to the React Native context over the message bridge, because the NFC
// radio is not reachable from the worker.
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

  // Only Keycard is supported for now. Once other cards are added, this gets set
  // from the card the account was imported with.
  nfcWalletType: NfcWalletType = 'keycard'

  deviceModel = 'Keycard'

  // The id of the wallet on the card the accounts were imported from. Set by the
  // key iterator on import, so it lands in the key meta as the device id.
  deviceId = ''

  isUnlocked = () => true

  unlock = async () => 'ALREADY_UNLOCKED' as const

  unlockedPath = ''

  unlockedPathKeyAddr = ''

  async signHash(args: {
    hashHex: string
    path: string
    expectedKeyUid: string
  }): Promise<NfcSignature> {
    try {
      return await callNative<NfcSignature>('keycard.signHash', args)
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'Signing with the card failed.')
    }
  }

  async signingCleanup() {
    await callNative('keycard.cancel')
  }

  cleanUp = async () => {
    await callNative('keycard.cancel')
  }
}

export default NfcController
