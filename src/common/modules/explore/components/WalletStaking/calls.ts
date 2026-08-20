import { Interface, WeiPerEther } from 'ethers'

import { STK_WALLET, WALLET_STAKING_ADDR, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import { Call } from '@ambire-common/libs/accountOp/types'

const walletInterface = new Interface(['function approve(address spender, uint256 amount)'])
const stkWalletInterface = new Interface([
  'function enter(uint256 amount)',
  'function unwrap(uint256 shareAmount)'
])
const walletStakingInterface = new Interface([
  'function leave(uint256 shares, bool skipMint)',
  'function withdraw(uint256 shares, uint256 unlocksAt, bool skipMint)'
])

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

/** Builds the Ethereum calls that unwrap stkWALLET and start its 30-day unstaking period. */
export const getUnstakeWalletCalls = (amount: bigint, shareValue: bigint): Call[] => {
  if (shareValue <= 0n) throw new Error('The staking share value must be greater than zero.')

  const shares = (amount * WeiPerEther) / shareValue

  return [
    {
      to: STK_WALLET,
      value: 0n,
      data: stkWalletInterface.encodeFunctionData('unwrap', [shares])
    },
    {
      to: WALLET_STAKING_ADDR,
      value: 0n,
      data: walletStakingInterface.encodeFunctionData('leave', [shares, false])
    }
  ]
}

/** Builds the Ethereum call that completes an unlocked WALLET withdrawal. */
export const getWithdrawWalletCalls = (shares: bigint, unlocksAt: bigint): Call[] => [
  {
    to: WALLET_STAKING_ADDR,
    value: 0n,
    data: walletStakingInterface.encodeFunctionData('withdraw', [shares, unlocksAt, true])
  }
]
