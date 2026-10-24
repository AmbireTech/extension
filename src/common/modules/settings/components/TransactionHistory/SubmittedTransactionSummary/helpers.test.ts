import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'

import {
  formatBalanceChangeAmount,
  getRepeatTransactionRequestParams,
  getSummaryBalanceChanges,
  isNftBalanceChange
} from './helpers'
import { getDappInteractionsFromHumanizedCalls } from './humanizedHelpers'
import { SubmittedAccountOpLike } from './types'

const POSITION_MANAGER = '0xbD216513d74C8cf14cf4747E6AaA6420FF64ee9e'

const buildAccountOp = (
  nftBalanceChanges: SubmittedAccountOpLike['nftBalanceChanges']
): SubmittedAccountOpLike => ({
  id: 'activity-nft-test',
  accountAddr: '0xB674F3fd5F43464dB0448a57529eAF37F04cceA5',
  chainId: 1n,
  calls: [],
  gasFeePayment: null,
  status: AccountOpStatus.Success,
  timestamp: 0,
  identifiedBy: {
    type: 'Transaction',
    identifier: '0x1234'
  },
  balanceChanges: [],
  nftBalanceChanges
})

describe('activity NFT balance changes', () => {
  test('includes incoming and outgoing NFTs in the displayed balance changes', () => {
    const balanceChanges = getSummaryBalanceChanges(
      buildAccountOp([
        {
          address: POSITION_MANAGER,
          chainId: 1n,
          tokenId: 123n,
          balanceChange: 1n
        },
        {
          address: POSITION_MANAGER,
          chainId: 1n,
          tokenId: 456n,
          balanceChange: -1n
        }
      ])
    )

    expect(balanceChanges).toHaveLength(2)
    expect(balanceChanges.every(isNftBalanceChange)).toBe(true)
    expect(balanceChanges.map(formatBalanceChangeAmount)).toEqual(['+1', '-1'])
  })
})

describe('getRepeatTransactionRequestParams', () => {
  const ACCOUNT_ADDR = '0xB674F3fd5F43464dB0448a57529eAF37F04cceA5'
  const PAST_ROUTE_ID = 'past-route-id'
  const SWAP_CALLS: SubmittedAccountOpLike['calls'] = [
    {
      id: `${PAST_ROUTE_ID}-approval`,
      to: '0x0000000000000000000000000000000000000002',
      value: 0n,
      data: '0x1234',
      activeRouteId: PAST_ROUTE_ID
    },
    {
      id: PAST_ROUTE_ID,
      to: '0x0000000000000000000000000000000000000001',
      value: 0n,
      data: '0xabcdef',
      activeRouteId: PAST_ROUTE_ID
    }
  ]

  const repeatSwap = () =>
    getRepeatTransactionRequestParams({ calls: SWAP_CALLS, chainId: 1n, accountAddr: ACCOUNT_ADDR })

  test('keeps a plain transaction as it is', () => {
    const calls: SubmittedAccountOpLike['calls'] = [
      { id: 'send', to: ACCOUNT_ADDR, value: 1n, data: '0x' }
    ]

    expect(
      getRepeatTransactionRequestParams({ calls, chainId: 1n, accountAddr: ACCOUNT_ADDR })
    ).toEqual({ calls, meta: { chainId: 1n, accountAddr: ACCOUNT_ADDR } })
  })

  test('does not link a repeated swap to a swap route, so a batched swap keeps its own', () => {
    const { meta } = repeatSwap()

    expect(meta).toEqual({ chainId: 1n, accountAddr: ACCOUNT_ADDR })
  })

  test('still shows a repeated swap as a swap/bridge in the activity', () => {
    const { calls, meta } = repeatSwap()

    expect(calls.map(({ to, data, value }) => ({ to, data, value }))).toEqual(
      SWAP_CALLS.map(({ to, data, value }) => ({ to, data, value }))
    )

    const interactions = getDappInteractionsFromHumanizedCalls(
      { ...buildAccountOp([]), calls, meta },
      []
    )
    expect(interactions.map(({ name }) => name)).toEqual(['Swap/Bridge'])
  })

  test('detaches the calls of a repeated swap from the past route', () => {
    const { calls } = repeatSwap()
    const repeatedRouteId = calls[0]?.activeRouteId

    expect(repeatedRouteId).toBeTruthy()
    expect(repeatedRouteId).not.toBe(PAST_ROUTE_ID)
    // the approval and the swap stay grouped, so removing one still removes the other
    expect(calls.map((call) => call.activeRouteId)).toEqual([repeatedRouteId, repeatedRouteId])
    // the past activity record is not mutated
    expect(SWAP_CALLS.map((call) => call.activeRouteId)).toEqual([PAST_ROUTE_ID, PAST_ROUTE_ID])
  })

  test('uses a different route for each repeat of the same swap', () => {
    expect(repeatSwap().calls[0]?.activeRouteId).not.toBe(repeatSwap().calls[0]?.activeRouteId)
  })
})
