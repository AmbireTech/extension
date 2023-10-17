import * as sigUtil from 'eth-sig-util'
import {
  bufferToHex,
  ecrecover,
  fromRpcSig,
  hashPersonalMessage,
  publicToAddress,
  stripHexPrefix,
  toBuffer,
  toChecksumAddress
} from 'ethereumjs-util'

import { LEDGER_LIVE_HD_PATH } from '@ambire-common/consts/derivation'
import { ExternalKey, KeystoreSigner } from '@ambire-common/interfaces/keystore'
import { TypedMessage } from '@ambire-common/interfaces/userRequest'
import { serialize } from '@ethersproject/transactions'
import LedgerController from '@web/modules/hardware-wallet/controllers/LedgerController'

import type { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'

const EIP_155_CONSTANT = 35

class LedgerSigner implements KeystoreSigner {
  key: ExternalKey

  controller: LedgerController | null = null

  constructor(_key: ExternalKey) {
    this.key = _key
  }

  init(_controller: any) {
    this.controller = _controller
  }

  async signRawTransaction(params: any) {
    if (!this.controller) {
      throw new Error('ledgerSigner: ledgerController not initialized')
    }

    await this.controller._reconnect()

    await this.controller.unlock(this.key.meta.hdPath)

    try {
      const unsignedTxObj = {
        ...params,
        gasLimit: params.gasLimit || params.gas
      }

      delete unsignedTxObj.from
      delete unsignedTxObj.gas

      const serializedUnsigned = serialize(unsignedTxObj)

      // @ts-ignore
      const rsvRes = await this.controller.app.signTransaction(
        this.key.meta.hdPath,
        serializedUnsigned.substr(2) // TODO: maybe use stripHexPrefix instead
      )

      const intV = parseInt(rsvRes.v, 16)
      const signedChainId = Math.floor((intV - EIP_155_CONSTANT) / 2)

      if (signedChainId !== params.chainId) {
        throw new Error(`ledgerSigner: invalid returned V 0x${rsvRes.v}`)
      }

      delete unsignedTxObj.v
      const signature = serialize(unsignedTxObj, {
        r: `0x${rsvRes.r}`,
        s: `0x${rsvRes.s}`,
        v: intV
      })

      // TODO: validate the signature - check if the address of the signature matches the address of the key
      return signature
    } catch (e: any) {
      throw new Error(`ledgerSigner: signature denied ${e.message || e}`)
    }
  }

  async signTypedData({ domain, types, message, primaryType }: TypedMessage) {
    if (!this.controller) {
      throw new Error(
        'Something went wrong with triggering the sign message mechanism. Please try again or contact support if the problem persists.'
      )
    }

    await this.controller.unlock(this.key.meta.hdPath)

    if (!types.EIP712Domain) {
      throw new Error('ledgerSigner: only EIP712 messages are supported')
    }

    if (!primaryType) {
      throw new Error(
        'ledgerSigner: primaryType is missing but required for signing typed data with a ledger device'
      )
    }

    try {
      const domainSeparatorHex = sigUtil.TypedDataUtils.hashStruct(
        'EIP712Domain',
        domain,
        types,
        true
      ).toString('hex')
      const hashStructMessageHex = sigUtil.TypedDataUtils.hashStruct(
        Object.keys(types)[0], // primary type
        message,
        types,
        true
      ).toString('hex')

      const rsvRes = await this.controller.app!.signEIP712HashedMessage(
        this.key.meta.hdPath,
        domainSeparatorHex,
        hashStructMessageHex
      )
      let v: any = rsvRes.v - 27
      v = v.toString(16)
      if (v.length < 2) {
        v = `0${v}`
      }

      const signature = `0x${rsvRes.r}${rsvRes.s}${v}`
      const signedWithKey = sigUtil.recoverTypedSignature_v4({
        data: { types, domain, message, primaryType },
        sig: signature
      })

      if (toChecksumAddress(signedWithKey) !== toChecksumAddress(this.key.id)) {
        throw new Error("ledgerSigner: the signature doesn't match the right key")
      }

      return signature
    } catch (e: any) {
      throw new Error(`ledgerSigner: signature denied ${e.message || e}`)
    }
  }

  async signMessage(hash: string | Uint8Array) {
    if (!this.controller) {
      throw new Error(
        'Something went wrong with triggering the sign message mechanism. Please try again or contact support if the problem persists.'
      )
    }

    if (hash instanceof Uint8Array) {
      throw new Error(
        "Request for signing a Uint8Array detected. That's not a typical sign message request and it is disallowed with Ambire."
      )
    }

    if (!stripHexPrefix(hash)) {
      throw new Error(
        'Request for signing an empty message detected. Signing empty messages with Ambire is disallowed.'
      )
    }

    await this.controller.unlock(this.key.meta.hdPath)

    try {
      const rsvRes = await this.controller.app!.signPersonalMessage(
        this.key.meta?.hdPath || LEDGER_LIVE_HD_PATH,
        stripHexPrefix(hash)
      )

      const signature = `0x${rsvRes?.r}${rsvRes?.s}${rsvRes?.v.toString(16)}`
      const sigParams = fromRpcSig(toBuffer(signature) as any)
      const message = toBuffer(hash)
      const msgHash = hashPersonalMessage(message)
      const publicKey = ecrecover(msgHash as any, sigParams.v, sigParams.r, sigParams.s)
      const sender = publicToAddress(publicKey)
      const signedWithKey = bufferToHex(sender)

      if (toChecksumAddress(signedWithKey) !== toChecksumAddress(this.key.addr)) {
        throw new Error(
          "Signature validation failed. Address in signature doesn't match key address. Please try again or contact Ambire support if issue persists."
        )
      }

      return signature
    } catch (e: any) {
      throw new Error(
        e?.message ||
          'Signing the message failed. Please try again or contact Ambire support if issue persists.'
      )
    }
  }
}

export default LedgerSigner
