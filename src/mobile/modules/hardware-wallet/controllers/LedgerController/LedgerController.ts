import { hexlify } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'
import { normalizeLedgerMessage } from '@ambire-common/libs/ledger/ledger'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import { stripHexPrefix } from '@ambire-common/utils/stripHexPrefix'
import { LedgerControllerInterface } from '@common/modules/hardware-wallet/interfaces/ledgerController'

// Mobile counterpart of the web LedgerController. The actual device handling lives in the
// React Native native context (see src/mobile/services/ledger/ledgerBleService).
// This controller runs inside the WebView worker bundle alongside the rest of
// the ambire-common controllers, and forwards every operation to the native
// service over the message bridge (`window.sendToRNAsync`).
export type LedgerSignature = { r: string; s: string; v: number }

const callNative = <T>(type: string, payload: Record<string, any> = {}): Promise<T> => {
  // sendToRNAsync is installed on `window` by injectedLogic.ts. The controller
  // only ever runs inside the worker, so it is always present here.
  return (window as any).sendToRNAsync(type, payload)
}

class LedgerController implements ExternalSignerController, LedgerControllerInterface {
  unlockedPath: string = ''

  unlockedPathKeyAddr: string = ''

  walletSDK: boolean = false

  type = 'ledger'

  deviceModel = 'unknown'

  deviceId = ''

  isUnlocked(path?: string, expectedKeyOnThisPath?: string) {
    if (!path || !expectedKeyOnThisPath) {
      return !!(this.unlockedPath && this.unlockedPathKeyAddr)
    }

    return this.unlockedPathKeyAddr === expectedKeyOnThisPath && this.unlockedPath === path
  }

  async unlock(
    path: ReturnType<typeof getHdPathFromTemplate>,
    expectedKeyOnThisPath?: string
  ): Promise<'ALREADY_UNLOCKED' | 'JUST_UNLOCKED'> {
    // Cache is trusted only for the keyless "is anything unlocked" check. With an
    // expected key (pre-signing), always re-derive: device/seed may have changed.
    if (!expectedKeyOnThisPath && this.isUnlocked(path)) return 'ALREADY_UNLOCKED'

    try {
      const address = await callNative<string>('ledger.getAddress', { path })

      const wasAlreadyUnlocked = this.unlockedPath === path && this.unlockedPathKeyAddr === address
      this.unlockedPath = path
      this.unlockedPathKeyAddr = address
      this.walletSDK = true

      return wasAlreadyUnlocked ? 'ALREADY_UNLOCKED' : 'JUST_UNLOCKED'
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
