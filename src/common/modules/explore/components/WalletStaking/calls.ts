import { Interface, parseUnits } from 'ethers'

import { STK_WALLET, WALLET_STAKING_ADDR, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import { getXWalletAmountFromWallet } from '@ambire-common/libs/walletStaking/shareValue'

import type { Call } from '@ambire-common/libs/accountOp/types'
import type { WalletStakingMode } from '@common/modules/explore/constants/walletStaking'

const walletInterface = new Interface(['function approve(address spender, uint256 amount)'])
const stkWalletInterface = new Interface([
  'function enter(uint256 amount)',
  'function wrap(uint256 shareAmount)',
  'function unwrap(uint256 shareAmount)'
])
const walletStakingInterface = new Interface([
  'function leave(uint256 shares, bool skipMint)',
  'function withdraw(uint256 shares, uint256 unlocksAt, bool skipMint)'
])

const UNSTAKE_MAX_AMOUNT_BASIS_POINTS = 9999n
const BASIS_POINTS_DIVISOR = 10000n
const WALLET_TOKEN_DECIMALS = 18

/** Safely converts a staking form amount into WALLET token units. */
export const getWalletStakingAmountInWei = (amount: string) => {
  const normalizedAmount = amount.endsWith('.') ? amount.slice(0, -1) : amount
  if (!normalizedAmount) return 0n

  try {
    return parseUnits(normalizedAmount, WALLET_TOKEN_DECIMALS)
  } catch {
    return 0n
  }
}

/** Leaves a small stkWALLET remainder only when selecting the unstake maximum. */
export const getWalletStakingMaxAmount = (balance: bigint, mode: WalletStakingMode) =>
  mode === 'unstake' ? (balance * UNSTAKE_MAX_AMOUNT_BASIS_POINTS) / BASIS_POINTS_DIVISOR : balance

/** Builds the Ethereum calls that approve WALLET and stake it into stkWALLET. */
export const getStakeWalletCalls = (amount: bigint): Call[] => [
  {
    to: WALLET_TOKEN,
    value: 0n,
    data: walletInterface.encodeFunctionData('approve', [STK_WALLET, amount])
  },
  {
    to: STK_WALLET,
    value: 0n,
    data: stkWalletInterface.encodeFunctionData('enter', [amount])
  }
]

/** Builds the Ethereum calls that approve xWALLET and migrate it into stkWALLET. */
export const getMigrateXWalletCalls = (shares: bigint): Call[] => [
  {
    to: WALLET_STAKING_ADDR,
    value: 0n,
    data: walletInterface.encodeFunctionData('approve', [STK_WALLET, shares])
  },
  {
    to: STK_WALLET,
    value: 0n,
    data: stkWalletInterface.encodeFunctionData('wrap', [shares])
  }
]

/** Unwraps stkWALLET, restores missing pending shares, and leaves any remainder. */
export const getUnstakeWalletCalls = (
  amount: bigint,
  shareValue: bigint,
  sharesToRestore: bigint = 0n
): Call[] => {
  if (shareValue <= 0n) throw new Error('The staking share value must be greater than zero.')

  const shares = getXWalletAmountFromWallet(amount, shareValue)
  const sharesToLeave = shares > sharesToRestore ? shares - sharesToRestore : 0n

  const calls: Call[] = [
    {
      to: STK_WALLET,
      value: 0n,
      data: stkWalletInterface.encodeFunctionData('unwrap', [shares])
    }
  ]

  if (sharesToLeave > 0n) {
    calls.push({
      to: WALLET_STAKING_ADDR,
      value: 0n,
      data: walletStakingInterface.encodeFunctionData('leave', [sharesToLeave, false])
    })
  }

  return calls
}

/** Builds the Ethereum call that completes an unlocked WALLET withdrawal. */
export const getWithdrawWalletCalls = (shares: bigint, unlocksAt: bigint): Call[] => [
  {
    to: WALLET_STAKING_ADDR,
    value: 0n,
    data: walletStakingInterface.encodeFunctionData('withdraw', [shares, unlocksAt, true])
  }
]
