import { Session } from '@ambire-common/classes/session'
import { Key } from '@ambire-common/interfaces/keystore'
import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'

export type ProviderRequest<TMethod = string> = {
  method: TMethod
  params?: any
  session: Session
  origin: string
}

export type RequestRes = {
  type?: string
  address?: string
  uiRequestComponent?: string
  isSend?: boolean
  isSpeedUp?: boolean
  isCancel?: boolean
  isSwap?: boolean
  isGnosis?: boolean
  account?: any
  extra?: Record<string, any>
  traceId?: string
  signingTxId?: string
  hash?: string
  error?: string
  isUserOp?: boolean
  submittedAccountOp?: SubmittedAccountOp
  keyAddr?: Key['addr'] // for eth_getEncryptionPublicKey and eth_decrypt
  keyType?: Key['type'] // for eth_getEncryptionPublicKey and eth_decrypt
  encryptedMessage?: string // for eth_decrypt
}

export type Web3WalletPermission = {
  // Specified by EIP-2255:
  parentCapability: string // The name of the method corresponding to the permission
  date: number // timestamp of the permission request, optional in EIP-2255, but MetaMask always returns it
  invoker: string // the URI of the dapp being granted this permission, MetaMask always returns it
  caveats: Caveat[] // an array of caveats that specify restrictions on the permission
  // MetaMask specific:
  id: string // permission ID, random and unique, MetaMask always returns it
}

// Props specified by EIP-2255
export type Caveat = {
  type: string
  value: any // An arbitrary JSON value. Only meaningful in the context of the type of the Caveat.
}
