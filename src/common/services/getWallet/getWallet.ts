import networks from 'ambire-common/src/constants/networks'
import { getProvider } from 'ambire-common/src/services/provider'
import { ethers } from 'ethers'
import { _TypedDataEncoder } from 'ethers/lib/utils'

import {
  ledgerSignMessage,
  ledgerSignMessage712,
  ledgerSignTransaction
} from '@mobile/modules/hardware-wallet/services/ledger'

const wallets: any = {}

function getWalletNew({ chainId, signer, signerExtra }: any, device: any) {
  if (signerExtra && signerExtra.type === 'ledger') {
    return {
      signMessage: (hash: any) =>
        ledgerSignMessage(ethers.utils.hexlify(hash), signer.address, device),
      signTransaction: (params: any) => ledgerSignTransaction(params, chainId, device),
      sendTransaction: async (transaction: any) => {
        const network = networks.find((n) => n.chainId === transaction.chainId)
        if (!network) throw Error(`no network found for chainId : ${transaction.chainId}`)
        const provider = getProvider(network.id)
        if (!provider) throw Error(`no provider found for network : ${network.id}`)

        transaction.nonce = ethers.utils.hexlify(
          await provider.getTransactionCount(transaction.from)
        )

        const signedTx = await ledgerSignTransaction(transaction, transaction.chainId, device)

        return provider.sendTransaction(signedTx)
      },
      _signTypedData: (domain: any, types: any, value: any) => {
        const domainSeparator = _TypedDataEncoder.hashDomain(domain)
        const hashStructMessage = _TypedDataEncoder.hashStruct(
          _TypedDataEncoder.getPrimaryType(types),
          types,
          value
        )
        return ledgerSignMessage712(domainSeparator, hashStructMessage, signer.address, device)
      }
    }
  }
  // TODO: implement Trezor logic here
  if (signer.one) {
    throw new Error(
      'getWallet not applicable for QuickAccounts: use primaryKeyBackup with the passphrase and /second-sig'
    )
  } else {
    throw new Error('unknown signer type')
  }
}

export function getWallet({ signer, signerExtra, chainId }: any, device: any) {
  const id = `${signer.address || signer.one}${chainId}`

  try {
    if (wallets[id]) return wallets[id]
    // eslint-disable-next-line no-return-assign
    return (wallets[id] = getWalletNew({ signer, signerExtra, chainId }, device))
  } catch (e) {
    console.error('Error getting wallet:', e)
    throw new Error('Failed to get or create wallet')
  }
}
