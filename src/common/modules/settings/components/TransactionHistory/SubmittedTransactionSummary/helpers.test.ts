import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'

import { formatBalanceChangeAmount, getSummaryBalanceChanges, isNftBalanceChange } from './helpers'
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
