import { ERC_4337_ENTRYPOINT } from '@ambire-common/consts/deploy'
import { SignUserOperation } from '@ambire-common/interfaces/userOperation'
import { GasSpeeds } from '@ambire-common/services/bundlers/types'
import { getRpcProvider } from '@ambire-common/services/provider'
import { executeBySenderInterface } from '@benzin/screens/BenzinScreen/constants/humanizerInterfaces'
import { delayPromise } from '@common/utils/promises'
import { RELAYER_URL } from '@env'
import HumanReadableError from '@legends/classes/HumanReadableError'
import useProviderContext from '@legends/hooks/useProviderContext'
import { Interface, toBeHex } from 'ethers'

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
  const getCallsStatus = async (
    callsId: string,
    is4337Required: boolean = true
  ): Promise<Receipt> => {
    if (!provider) return

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

  const walletSignUserOps = async (
    chainId: string,
    accAddr: string,
    calls: { to: string; data: string; value?: string }[]
  ) => {
    const baseSepoliaProvider: any = getRpcProvider(
      ['https://sepolia.base.org'],
      84532n,
      'https://sepolia.base.org'
    )
    const opSepoliaProvider: any = getRpcProvider(
      ['https://sepolia.optimism.io'],
      11155420n,
      'https://sepolia.optimism.io'
    )
    const entryPointInterface = new Interface([
      'function getNonce(address, uint192) public view returns (uint256 nonce)'
    ])
    const entryPointNonce = await baseSepoliaProvider.call({
      to: ERC_4337_ENTRYPOINT,
      data: entryPointInterface.encodeFunctionData('getNonce', [accAddr, 0])
    })
    const nonce =
      entryPointNonce && entryPointNonce !== '0x' ? toBeHex(BigInt(entryPointNonce)) : '0x00'
    const entryPointNonceOp = await opSepoliaProvider.call({
      to: ERC_4337_ENTRYPOINT,
      data: entryPointInterface.encodeFunctionData('getNonce', [accAddr, 0])
    })
    const nonceOp =
      entryPointNonceOp && entryPointNonceOp !== '0x' ? toBeHex(BigInt(entryPointNonceOp)) : '0x00'
    const callData = executeBySenderInterface.encodeFunctionData(
      'executeBySender',
      calls.map((call) => {
        return [[call.to, call.value?.toString() || 0, call.data]]
      })
    )
    const baseSepoliaChainId = 84532n
    const opSepoliaChainId = 11155420n
    const gasPrice = await getGasPrice(baseSepoliaChainId)
    const gasPriceOp = await getGasPrice(opSepoliaChainId)
    const signUserOpsIdentifierJsonString: any = await provider!.request({
      method: 'wallet_signUserOperations',
      params: [
        {
          chainId: toBeHex(baseSepoliaChainId),
          userOperation: {
            sender: accAddr,
            nonce,
            callData,
            callGasLimit: toBeHex(100000),
            verificationGasLimit: toBeHex(100000),
            preVerificationGas: toBeHex(100000),
            maxFeePerGas: gasPrice.medium.maxFeePerGas,
            maxPriorityFeePerGas: gasPrice.medium.maxPriorityFeePerGas
          }
        },
        {
          chainId: toBeHex(opSepoliaChainId),
          userOperation: {
            sender: accAddr,
            nonce: nonceOp,
            callData,
            callGasLimit: toBeHex(100000),
            verificationGasLimit: toBeHex(100000),
            preVerificationGas: toBeHex(100000),
            maxFeePerGas: gasPriceOp.medium.maxFeePerGas,
            maxPriorityFeePerGas: gasPriceOp.medium.maxPriorityFeePerGas
          }
        }
      ]
    })
    const signUserOpsIdentifier: { chainId: string; userOp: SignUserOperation }[] = JSON.parse(
      signUserOpsIdentifierJsonString
    )
    for (let i = 0; i <= signUserOpsIdentifier.length; i++) {
      const oneIdentifier = signUserOpsIdentifier[i]
      // eslint-disable-next-line no-await-in-loop
      const userOpHash = await provider!.request({
        method: 'eth_sendRawUserOperation',
        params: [oneIdentifier]
      })
    }

    return signUserOpsIdentifierJsonString as string
  }

  return {
    getCallsStatus,
    sendCalls,
    // the correct format for chainId when using erc5792
    chainId: '0x2105'
  }
}

export default useErc5792
