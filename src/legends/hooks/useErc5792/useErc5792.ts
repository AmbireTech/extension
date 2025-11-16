import { Hex } from '@ambire-common/interfaces/hex'
import {
  ChainIdWithUserOp,
  PartialOperation,
  SignUserOperation
} from '@ambire-common/interfaces/userOperation'
import { GasSpeeds } from '@ambire-common/services/bundlers/types'
import { getRpcProvider } from '@ambire-common/services/provider'
import wait from '@ambire-common/utils/wait'
import { executeBySenderInterface } from '@benzin/screens/BenzinScreen/constants/humanizerInterfaces'
import { delayPromise } from '@common/utils/promises'
import { RELAYER_URL } from '@env'
import HumanReadableError from '@legends/classes/HumanReadableError'
import useProviderContext from '@legends/hooks/useProviderContext'
import { concat, randomBytes, toBeHex } from 'ethers'

export const ERRORS = {
  txFailed: 'tx-failed',
  not4337: 'not-4337'
}

type Receipt = {
  blockHash: string
  blockNumber: string
  chainId: string
  gasUsed: string
  logs: {
    address: string
    data: string
    blockHash: string
    blockNumber: string
    logIndex: string
    transactionHash: string
    transactionIndex: string
    topics: string[]
  }[]
  status: string
  transactionHash: string
}

const getGasPrice = async (chainId: bigint): Promise<GasSpeeds> => {
  const url = `https://api.pimlico.io/v2/${chainId.toString()}/rpc?apikey=${
    process.env.REACT_APP_PIMLICO_API_KEY
  }`
  const provider = getRpcProvider([url], chainId)
  const prices: any = await provider.send('pimlico_getUserOperationGasPrice', [])
  prices.medium = prices.standard
  prices.ape = prices.fast
  delete prices.standard
  return prices
}

const useErc5792 = () => {
  const { provider } = useProviderContext()
  // all fields below marked as string should be HEX!
  const sendCalls = async (
    chainId: string,
    accAddr: string,
    calls: { to: string; data: string; value?: string }[],
    useSponsorship = true
  ) => {
    if (!provider) return ''

    const sendCallsIdentifier: any = await provider.request({
      method: 'wallet_sendCalls',
      params: [
        {
          version: '1.0',
          chainId,
          from: accAddr,
          calls,
          capabilities: useSponsorship
            ? {
                paymasterService: {
                  [chainId]: {
                    url: `${RELAYER_URL}/v2/sponsorship`
                  }
                }
              }
            : undefined
        }
      ]
    })

    return sendCallsIdentifier as string
  }

  // the callsId should be an identifier return by the wallet
  // from wallet_sendCalls
  const getCallsStatus = async (callsId: string): Promise<Receipt> => {
    if (!provider) throw new Error('provider destroyed')

    let receipt = null
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const callStatus: any = await provider.request({
        method: 'wallet_getCallsStatus',
        params: [callsId]
      })

      if (callStatus.status === 'CONFIRMED') {
        receipt = callStatus.receipts[0]
        break
      }
      if (callStatus.status === 'REJECTED') {
        throw new Error('Error, try again')
      }

      // eslint-disable-next-line no-await-in-loop
      await delayPromise(1500)
    }

    if (Number(receipt.status) === 0)
      throw new HumanReadableError(
        'The transaction failed and will not grant any XP. Please try signing again.',
        {
          cause: ERRORS.txFailed
        }
      )

    return receipt
  }

  const walletSignUserOps = async (userOperations: PartialOperation[]) => {
    const filledUserOps: ChainIdWithUserOp[] = []
    for (let i = 0; i < userOperations.length; i++) {
      const op = userOperations[i]
      // eslint-disable-next-line no-await-in-loop
      const prices = await getGasPrice(op.chainId)
      filledUserOps.push({
        chainId: toBeHex(op.chainId) as Hex,
        userOperation: {
          ...op,
          nonce: concat([randomBytes(24), toBeHex(0, 8)]),
          maxFeePerGas: prices.medium.maxFeePerGas,
          maxPriorityFeePerGas: prices.medium.maxPriorityFeePerGas
        }
      })
    }
    const signUserOpsIdentifierJsonString: any = await provider!.request({
      method: 'wallet_signUserOperations',
      params: filledUserOps
    })
    const signUserOpsIdentifier: { chainId: string; userOp: SignUserOperation }[] = JSON.parse(
      signUserOpsIdentifierJsonString
    )
    for (let i = 0; i <= signUserOpsIdentifier.length; i++) {
      const oneIdentifier = signUserOpsIdentifier[i]
      // eslint-disable-next-line no-await-in-loop
      await provider!.request({
        method: 'eth_sendRawUserOperation',
        params: [oneIdentifier]
      })
    }

    return signUserOpsIdentifierJsonString as string
  }

  const walletSignUserOpsForLocalTesting = async (
    chainId: string,
    accAddr: string,
    calls: { to: string; data: string; value?: string }[],
    useSponsorship = true
  ) => {
    const opSepoliaChainId = 11155420n
    const arbitrumSepoliaChainId = 421614n
    const callData = executeBySenderInterface.encodeFunctionData('executeBySender', [
      calls.map((c) => [c.to, c.value ?? '0x', c.data])
    ])
    const [prices, pricesArb] = await Promise.all([
      getGasPrice(opSepoliaChainId),
      getGasPrice(arbitrumSepoliaChainId)
    ])
    const filledUserOps: ChainIdWithUserOp[] = [
      {
        chainId: toBeHex(opSepoliaChainId) as Hex,
        userOperation: {
          callData,
          callGasLimit: toBeHex(100000),
          verificationGasLimit: toBeHex(100000),
          preVerificationGas: toBeHex(100000),
          sender: accAddr,
          nonce: concat([randomBytes(24), toBeHex(0, 8)]),
          maxFeePerGas: prices.medium.maxFeePerGas,
          maxPriorityFeePerGas: prices.medium.maxPriorityFeePerGas
        }
      },
      {
        chainId: toBeHex(opSepoliaChainId) as Hex,
        userOperation: {
          callData,
          callGasLimit: toBeHex(100000),
          verificationGasLimit: toBeHex(100000),
          preVerificationGas: toBeHex(100000),
          sender: accAddr,
          nonce: concat([randomBytes(24), toBeHex(0, 8)]),
          maxFeePerGas: prices.medium.maxFeePerGas,
          maxPriorityFeePerGas: prices.medium.maxPriorityFeePerGas
        }
      },
      {
        chainId: toBeHex(arbitrumSepoliaChainId) as Hex,
        userOperation: {
          callData,
          callGasLimit: toBeHex(100000),
          verificationGasLimit: toBeHex(100000),
          preVerificationGas: toBeHex(100000),
          sender: accAddr,
          nonce: concat([randomBytes(24), toBeHex(0, 8)]),
          maxFeePerGas: pricesArb.medium.maxFeePerGas,
          maxPriorityFeePerGas: pricesArb.medium.maxPriorityFeePerGas
        }
      }
    ]
    const signUserOpsIdentifierJsonString: any = await provider!.request({
      method: 'wallet_signUserOperations',
      params: filledUserOps
    })
    const signUserOpsIdentifier: { chainId: string; userOp: SignUserOperation }[] = JSON.parse(
      signUserOpsIdentifierJsonString
    )
    for (let i = 0; i <= signUserOpsIdentifier.length; i++) {
      const oneIdentifier = signUserOpsIdentifier[i]
      // eslint-disable-next-line no-await-in-loop
      await provider!.request({
        method: 'eth_sendRawUserOperation',
        params: [oneIdentifier]
      })
      // eslint-disable-next-line no-await-in-loop
      await wait(3000)
    }

    return signUserOpsIdentifierJsonString as string
  }

  return {
    getCallsStatus,
    sendCalls,
    walletSignUserOps,
    // the correct format for chainId when using erc5792
    chainId: '0x2105'
  }
}

export default useErc5792
