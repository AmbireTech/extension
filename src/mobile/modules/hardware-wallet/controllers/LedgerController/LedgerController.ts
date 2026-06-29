import { hexlify } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'
import { normalizeLedgerMessage } from '@ambire-common/libs/ledger/ledger'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import { stripHexPrefix } from '@ambire-common/utils/stripHexPrefix'

// Mobile counterpart of the web LedgerController. The actual device lives in the
// React Native native context (see src/mobile/services/ledger/ledgerBleService).
// This controller runs inside the WebView worker bundle alongside the rest of
// the ambire-common controllers, and forwards every operation to the native
// service over the message bridge (`window.sendToRNAsync`), mirroring how
// `crypto.scrypt` is bridged from src/mobile/shims/scrypt-js.ts.
export type LedgerSignature = { r: string; s: string; v: number }

const callNative = <T>(type: string, payload: Record<string, any> = {}): Promise<T> => {
  // sendToRNAsync is installed on `window` by injectedLogic.ts. The controller
  // only ever runs inside the worker, so it is always present here.
  return (window as any).sendToRNAsync(type, payload)
}

class LedgerController implements ExternalSignerController {
  unlockedPath: string = ''

  unlockedPathKeyAddr: string = ''

  // Sentinel mirroring the web controller's DMK `walletSDK`: ambire-common's
  // handleAccountPickerInitLedger uses its truthiness to detect an established
  // session (and to decide whether to clean up a previous one). The real device
  // session lives natively in ledgerBleService; here it's just a connected flag.
  walletSDK: boolean = false

  type = 'ledger'

  deviceModel = 'unknown'

  deviceId = ''

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

  async unlock(
    path: ReturnType<typeof getHdPathFromTemplate>,
    expectedKeyOnThisPath?: string
  ): Promise<'ALREADY_UNLOCKED' | 'JUST_UNLOCKED'> {
    if (this.isUnlocked(path, expectedKeyOnThisPath)) return 'ALREADY_UNLOCKED'

    try {
      const address = await callNative<string>('ledger.getAddress', { path })

      this.unlockedPath = path
      this.unlockedPathKeyAddr = address
      // The native getAddress succeeded, so the device session is established.
      this.walletSDK = true

      return 'JUST_UNLOCKED' as const
    } catch (e: any) {
      throw new ExternalSignerError(normalizeLedgerMessage(e?.message))
    }
  }

  retrieveAddresses = async (paths: string[]) => {
    try {
      return await callNative<string[]>('ledger.retrieveAddresses', { paths })
    } catch (e: any) {
      throw new ExternalSignerError(normalizeLedgerMessage(e?.message))
    }
  }

  async signPersonalMessage(derivationPath: string, messageHex: string) {
    try {
      return await callNative<LedgerSignature>('ledger.signPersonalMessage', {
        path: derivationPath,
        messageHex: stripHexPrefix(messageHex)
      })
    } catch (e: any) {
      throw new ExternalSignerError(normalizeLedgerMessage(e?.message))
    }
  }

  async signTransaction(derivationPath: string, transaction: Uint8Array) {
    try {
      return await callNative<LedgerSignature>('ledger.signTransaction', {
        path: derivationPath,
        rawTxHex: stripHexPrefix(hexlify(transaction))
      })
    } catch (e: any) {
      throw new ExternalSignerError(normalizeLedgerMessage(e?.message))
    }
  }

  signTypedData = async ({
    path,
    signTypedData: { domain, types, message, primaryType }
  }: {
    path: string
    signTypedData: TypedMessageUserRequest['meta']['params']
  }) => {
    try {
      return await callNative<LedgerSignature>('ledger.signTypedData', {
        path,
        typedData: { domain, types, message, primaryType }
      })
    } catch (e: any) {
      throw new ExternalSignerError(normalizeLedgerMessage(e?.message))
    }
  }

  async signingCleanup() {
    await callNative('ledger.signingCleanup')
  }

  cleanUp = async () => {
    this.unlockedPath = ''
    this.unlockedPathKeyAddr = ''
    this.walletSDK = false
    await callNative('ledger.cleanUp')
  }
}

export default LedgerController
