import { Signature, toBeHex, Transaction } from 'ethers'

import {
  ExternalKey,
  ExternalSignerController,
  KeystoreSigner
} from '@ambire-common/interfaces/keystore'
import {
  getMessageFromTrezorErrorCode,
  normalizeTrezorMessage
} from '@ambire-common/libs/trezor/trezor'
import { addHexPrefix } from '@ambire-common/utils/addHexPrefix'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import { stripHexPrefix } from '@ambire-common/utils/stripHexPrefix'
import wait from '@ambire-common/utils/wait'
import transformTypedData from '@trezor/connect-plugin-ethereum'
import TrezorController, {
  EthereumTransaction,
  EthereumTransactionEIP1559
} from '@web/modules/hardware-wallet/controllers/TrezorController'

const DELAY_BETWEEN_POPUPS = 1000

/**
 * This is necessary to avoid popup collision between the unlock & sign Trezor popups.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const delayBetweenPopupsIfNeeded = (status: 'JUST_UNLOCKED' | 'ALREADY_UNLOCKED') =>
  wait(status === 'JUST_UNLOCKED' ? DELAY_BETWEEN_POPUPS : 0)

/**
 * This is necessary to avoid popup collision between signing multiple times in
 * a row or between signing a message and then a raw transaction.
 */
const delayBetweenStarting = () => wait(DELAY_BETWEEN_POPUPS)

class TrezorSigner implements KeystoreSigner {
  key: ExternalKey

  controller: TrezorController | null = null

  constructor(_key: ExternalKey) {
    this.key = _key
  }

  init(externalDeviceController?: ExternalSignerController) {
    if (!externalDeviceController) {
      throw new Error('trezorSigner: externalDeviceController not initialized')
    }

    // TODO: Figure out a better approach than to cast the controller type
    this.controller = externalDeviceController as TrezorController
  }

  #prepareForSigning = async () => {
    await this.controller?.initialLoadPromise

    if (!this.controller?.isInitiated) {
      throw new Error(
        'Something went wrong when preparing Trezor to sign. Please try restarting your browser or contact support if the problem persists.'
      )
    }

    if (!this.controller || !this.controller.walletSDK) {
      throw new Error(
        'Something went wrong when preparing Trezor to sign. Please try again or contact support if the problem persists.'
      )
    }

    await delayBetweenStarting()

    // The process of "unlocking" Trezor is not necessary, since the Trezor SDK
    // itself handles the unlocking process internally (when a method is called).
    // The unlock was used only to determine if the Trezor is unlocked with the
    // correct seed and passphrase in advance (before signing). This was useful,
    // but the drawback is that for every signing, two separate Trezor popups
    // had to appear for the user (one for unlock and one for sign).
    // So to reduce this Trezor popup hell and to prioritize having less steps for
    // the user, since v4.9.0, skip the unlocking part and do the check if the
    // Trezor was unlocked with the correct seed and passphrase after signing
    // via the `#validateSigningKey` method.
    // const path = getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)
    // const status = await this.controller.unlock(path, this.key.addr)
    // await delayBetweenPopupsIfNeeded(status)
    // if (!this.controller.isUnlocked(path, this.key.addr)) {
    //   throw new Error(
    //     `The Trezor is unlocked, but with different seed or passphrase, because the address of the retrieved key is different than the key expected (${this.key.addr})`
    //   )
    // }
  }

  /**
   * Checks if the key (address) the Trezor signed with is the same as the key
   * (address) address we expect. They could differ if the Trezor was unlocked
   * with a different passphrase or seed.
   */
  #validateSigningKey = (signedWithAddr: string | null) => {
    // Missing address means the validation can't be done, skip it (should never happen)
    if (!signedWithAddr) return

    if (signedWithAddr !== this.key.addr) {
      throw new Error(
        `The key you signed with (${shortenAddress(
          signedWithAddr,
          13
        )}) is different than the key we expected (${shortenAddress(
          this.key.addr,
          13
        )}). You likely unlocked your Trezor with different passphrase or the Trezor you connected has a different seed.`
      )
    }
  }

  async #withNormalizedError<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error: any) {
      throw new Error(normalizeTrezorMessage(error?.message))
    }
  }

  signRawTransaction: KeystoreSigner['signRawTransaction'] = async (txnRequest) => {
    if (typeof txnRequest.value === 'undefined') {
      throw new Error('trezorSigner: missing value in transaction request')
    }

    await this.#prepareForSigning()

    // In case `maxFeePerGas` is provided, treat as an EIP-1559 transaction,
    // since there's no other better way to distinguish between the two in here.
    // Note: Trezor doesn't support EIP-2930 yet (type `1`).
    const type = typeof txnRequest.maxFeePerGas === 'bigint' ? 2 : 0

    type UnsignedTxnType = typeof type extends 2 ? EthereumTransactionEIP1559 : EthereumTransaction
    // Note: Trezor auto-detects the transaction `type`, based on the txn params
    const unsignedTxn: UnsignedTxnType = {
      ...txnRequest,
      // The incoming `txnRequest` param types mismatch the Trezor expected ones,
      // so normalize the types before passing them to the Trezor API
      value: toBeHex(txnRequest.value),
      gasLimit: toBeHex(txnRequest.gasLimit),
      // @ts-ignore since Trezor auto-detects the transaction `type`, based on
      // the txn params, it's fine to pass undefined when the type is `2` (EIP-1559)
      gasPrice: typeof txnRequest.gasPrice === 'bigint' ? toBeHex(txnRequest.gasPrice) : undefined,
      // @ts-ignore since Trezor auto-detects the transaction `type`, based on
      // the txn params, it's fine to pass undefined when the type is `0` (legacy)
      maxFeePerGas:
        typeof txnRequest.maxFeePerGas === 'bigint' ? toBeHex(txnRequest.maxFeePerGas) : undefined,
      // @ts-ignore since Trezor auto-detects the transaction `type`, based on
      // the txn params, it's fine to pass undefined when the type is `0` (legacy)
      maxPriorityFeePerGas:
        typeof txnRequest.maxPriorityFeePerGas === 'bigint'
          ? toBeHex(txnRequest.maxPriorityFeePerGas)
          : undefined,
      nonce: toBeHex(txnRequest.nonce),
      chainId: Number(txnRequest.chainId) // assuming the value is a BigInt within the safe integer range
    }

    const path = getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)
    const res = await this.#withNormalizedError(() =>
      this.controller!.walletSDK.ethereumSignTransaction({
        path,
        transaction: unsignedTxn
      })
    )

    if (!res.success)
      throw new Error(getMessageFromTrezorErrorCode(res.payload?.code, res.payload?.error))

    try {
      const signature = Signature.from({
        r: res.payload.r,
        s: res.payload.s,
        v: Signature.getNormalizedV(res.payload.v)
      })
      const signedTxn = Transaction.from({
        ...unsignedTxn,
        signature,
        // The nonce type of the normalized `unsignedTransaction` compatible
        // with Trezor  mismatches the EthersJS supported type, so fallback to
        // the nonce incoming from the `txnRequest` param
        nonce: txnRequest.nonce,
        type
      })

      // Use the `from` address from the `txnRequest` param, since the Trezor
      // SDK response does not include the signing `address` in its `res`.
      this.#validateSigningKey(signedTxn.from)

      return signedTxn.serialized
    } catch (error: any) {
      throw new Error(
        error?.message ||
          'Signing failed for unknown reason. Please try again later or contact support if the problem persists.'
      )
    }
  }

  signTypedData: KeystoreSigner['signTypedData'] = async ({
    domain,
    types,
    message,
    primaryType
  }) => {
    await this.#prepareForSigning()

    const path = getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)
    const dataWithHashes = transformTypedData({ domain, types, message, primaryType }, true)
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { domain_separator_hash, message_hash } = dataWithHashes

    const res = await this.#withNormalizedError(() =>
      this.controller!.walletSDK.ethereumSignTypedData({
        path,
        data: {
          types,
          message,
          domain,
          primaryType
        },
        metamask_v4_compat: true,
        // Trezor 1 only supports blindly signing hashes
        domain_separator_hash,
        message_hash
      } as any)
    )

    if (!res.success)
      throw new Error(getMessageFromTrezorErrorCode(res.payload?.code, res.payload?.error))

    this.#validateSigningKey(res.payload.address)

    return res.payload.signature
  }

  signMessage: KeystoreSigner['signMessage'] = async (hex) => {
    await this.#prepareForSigning()

    const path = getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)
    const res = await this.#withNormalizedError(() =>
      this.controller!.walletSDK.ethereumSignMessage({
        path,
        message: stripHexPrefix(hex),
        hex: true
      })
    )

    if (!res.success)
      throw new Error(getMessageFromTrezorErrorCode(res.payload?.code, res.payload?.error))

    this.#validateSigningKey(res.payload.address)

    return addHexPrefix(res.payload.signature)
  }
}

export default TrezorSigner
