import { delayPromise } from '@common/utils/promises'
import { RELAYER_URL } from '@env'
import HumanReadableError from '@legends/classes/HumanReadableError'
import { BASE_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useProviderContext from '@legends/hooks/useProviderContext'

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

const useErc5792 = () => {
  const { provider } = useProviderContext()
  const { chainId } = useAccountContext()
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
    callsId: string
    // is4337Required: boolean = true
  ): Promise<Receipt | undefined> => {
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
      throw new HumanReadableError('The transaction failed. Please try signing again.', {
        cause: ERRORS.txFailed
      })

    return receipt
  }

  return {
    getCallsStatus,
    sendCalls,
    // the correct format for chainId when using erc5792
    chainId: `0x${(chainId || BASE_CHAIN_ID).toString(16)}`
  }
}

export default useErc5792
