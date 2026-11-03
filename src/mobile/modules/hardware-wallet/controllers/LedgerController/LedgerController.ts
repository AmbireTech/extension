import { hexlify } from 'ethers'

import { Hex } from '@ambire-common/interfaces/hex'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'
import { normalizeLedgerMessage } from '@ambire-common/libs/ledger/ledger'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import { stripHexPrefix } from '@ambire-common/utils/stripHexPrefix'
import {
  LedgerControllerInterface,
  LedgerSignature
} from '@common/modules/hardware-wallet/interfaces/ledgerController'
import ledgerTransportService from '@mobile/services/ledger/ledgerTransportService'

// Mobile counterpart of the web LedgerController. The device handling itself lives
// in ledgerTransportService (BLE/USB via the Ledger DMK); this controller is the
// ambire-common-facing wrapper around it. Scanning and connecting are driven
// separately from the connect screen (via the useLedger hook), not from here.
export type { LedgerSignature }

class LedgerController implements ExternalSignerController, LedgerControllerInterface {
  /** Called once the device proved it holds a key, with the model of that device */
  #onKeyConfirmed?: (keyAddr: string, deviceModel: string) => void

  constructor({
    onKeyConfirmed
  }: { onKeyConfirmed?: (keyAddr: string, deviceModel: string) => void } = {}) {
    this.#onKeyConfirmed = onKeyConfirmed
  }

  unlockedPath: string = ''

  unlockedPathKeyAddr: string = ''

  walletSDK: boolean = false

  type = 'ledger'

  // The connected model, which the account picker stores in the key meta
  get deviceModel(): string {
    return ledgerTransportService.getDeviceModel() || 'unknown'
  }

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
      // An expected key means signing comes next
      const address = await ledgerTransportService.getAddress(path, !!expectedKeyOnThisPath)

      const wasAlreadyUnlocked = this.unlockedPath === path && this.unlockedPathKeyAddr === address
      this.unlockedPath = path
      this.unlockedPathKeyAddr = address
      this.walletSDK = true

      if (expectedKeyOnThisPath && address.toLowerCase() === expectedKeyOnThisPath.toLowerCase())
        this.#onKeyConfirmed?.(expectedKeyOnThisPath, this.deviceModel)

      return wasAlreadyUnlocked ? 'ALREADY_UNLOCKED' : 'JUST_UNLOCKED'
    } catch (e: any) {
      throw new ExternalSignerError(normalizeLedgerMessage(e?.message))
    }
  }

  retrieveAddresses = async (paths: string[]) => {
    try {
      const addresses: string[] = []
      // Serialized one-by-one (the service queue enforces this too); the Ledger
      // can't handle parallel getAddress calls.
      for (const path of paths) {
        addresses.push(await ledgerTransportService.getAddress(path))
      }
      return addresses
    } catch (e: any) {
      throw new ExternalSignerError(normalizeLedgerMessage(e?.message))
    }
  }

  async signPersonalMessage(derivationPath: string, messageHex: string) {
    try {
      return await ledgerTransportService.signPersonalMessage(
        derivationPath,
        stripHexPrefix(messageHex)
      )
    } catch (e: any) {
      throw new ExternalSignerError(normalizeLedgerMessage(e?.message))
    }
  }

  async signTransaction(derivationPath: string, transaction: Uint8Array) {
    try {
      return await ledgerTransportService.signTransaction(
        derivationPath,
        stripHexPrefix(hexlify(transaction))
      )
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
      return await ledgerTransportService.signTypedData(path, {
        domain,
        types,
        message,
        primaryType
      } as any)
    } catch (e: any) {
      throw new ExternalSignerError(normalizeLedgerMessage(e?.message))
    }
  }

  async sign7702(derivationPath: string, chainId: bigint, delegationAddr: Hex, nonce: bigint) {
    try {
      return await ledgerTransportService.sign7702(derivationPath, chainId, delegationAddr, nonce)
    } catch (e: any) {
      throw new ExternalSignerError(normalizeLedgerMessage(e?.message))
    }
  }

  async signingCleanup() {
    // Flushes the device's pending command state after an abandoned/rejected sign
    // so the next command starts clean. Does NOT cancel an in-flight on-device
    // prompt (that still resolves on the device).
    await ledgerTransportService.signingCleanup()
  }

  cleanUp = async () => {
    this.unlockedPath = ''
    this.unlockedPathKeyAddr = ''
    this.walletSDK = false
    await ledgerTransportService.cleanUp()
  }
}

export default LedgerController
