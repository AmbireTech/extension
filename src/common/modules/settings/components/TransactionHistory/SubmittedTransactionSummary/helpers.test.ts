import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'

import {
  formatBalanceChangeAmount,
  getSpeedUpFeeIncreasePercent,
  getSummaryBalanceChanges,
  isNftBalanceChange,
  isSpeedingUp
} from './helpers'
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

describe('speed up helpers', () => {
  const buildSpeedUp = ({
    status = AccountOpStatus.BroadcastedButNotConfirmed,
    enabled = true,
    replacedAmount,
    newAmount
  }: {
    status?: AccountOpStatus
    enabled?: boolean
    replacedAmount?: bigint
    newAmount?: bigint
  } = {}): SubmittedAccountOpLike => ({
    ...buildAccountOp([]),
    status,
    gasFeePayment:
      newAmount === undefined
        ? null
        : {
            isGasTank: false,
            paidBy: '0xB674F3fd5F43464dB0448a57529eAF37F04cceA5',
            paidByKeyType: 'internal',
            inToken: '0x0000000000000000000000000000000000000000',
            amount: newAmount,
            simulatedGasLimit: 21000n,
            gasPrice: 1n,
            broadcastOption: 'bySelf'
          },
    meta: {
      speedUp: {
        enabled,
        ...(replacedAmount !== undefined && {
          replacedFees: { gasPrice: 1n, amount: replacedAmount }
        })
      }
    }
  })

  test('isSpeedingUp is true only for a pending speed up', () => {
    expect(isSpeedingUp(buildSpeedUp())).toBe(true)
    expect(isSpeedingUp(buildSpeedUp({ status: AccountOpStatus.Success }))).toBe(false)
    expect(isSpeedingUp(buildSpeedUp({ enabled: false }))).toBe(false)
    expect(isSpeedingUp(buildAccountOp([]))).toBe(false)
  })

  test('getSpeedUpFeeIncreasePercent rounds the increase to whole percent', () => {
    expect(
      getSpeedUpFeeIncreasePercent(buildSpeedUp({ replacedAmount: 35n, newAmount: 126n }))
    ).toBe(260)
    expect(
      getSpeedUpFeeIncreasePercent(buildSpeedUp({ replacedAmount: 100n, newAmount: 125n }))
    ).toBe(25)
  })

  test('getSpeedUpFeeIncreasePercent is null when the fee is not higher or unknown', () => {
    expect(
      getSpeedUpFeeIncreasePercent(buildSpeedUp({ replacedAmount: 100n, newAmount: 100n }))
    ).toBeNull()
    expect(
      getSpeedUpFeeIncreasePercent(buildSpeedUp({ replacedAmount: 100n, newAmount: 90n }))
    ).toBeNull()
    expect(getSpeedUpFeeIncreasePercent(buildSpeedUp({ newAmount: 100n }))).toBeNull()
    expect(getSpeedUpFeeIncreasePercent(buildSpeedUp({ replacedAmount: 100n }))).toBeNull()
    expect(
      getSpeedUpFeeIncreasePercent(buildSpeedUp({ replacedAmount: 0n, newAmount: 1n }))
    ).toBeNull()
  })
})
