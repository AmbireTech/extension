import { Hex } from '@ambire-common/interfaces/hex'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'

export interface LedgerSignature {
  r: string
  s: string
  v: number
}

// Shape shared by the web (DMK-based) and mobile (native-bridged) LedgerController
// implementations, letting LedgerSigner stay in common without depending on either.
export interface LedgerControllerInterface {
  walletSDK: unknown
  unlock: (
    path: ReturnType<typeof getHdPathFromTemplate>,
    expectedKeyOnThisPath?: string
  ) => Promise<'ALREADY_UNLOCKED' | 'JUST_UNLOCKED'>
  isUnlocked: (path?: string, expectedKeyOnThisPath?: string) => boolean
  signTransaction: (derivationPath: string, transaction: Uint8Array) => Promise<LedgerSignature>
  signPersonalMessage: (derivationPath: string, messageHex: string) => Promise<LedgerSignature>
  signTypedData: (params: {
    path: string
    signTypedData: TypedMessageUserRequest['meta']['params']
  }) => Promise<LedgerSignature>
  /** Signs an EIP-7702 delegation with the sideloaded "Ambire Signer" app */
  sign7702: (
    derivationPath: string,
    chainId: bigint,
    delegationAddr: Hex,
    nonce: bigint
  ) => Promise<LedgerSignature>
  signingCleanup: () => Promise<void>
}
