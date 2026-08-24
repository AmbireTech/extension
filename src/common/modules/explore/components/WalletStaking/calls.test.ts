import { Interface, parseUnits } from 'ethers'

import { STK_WALLET, WALLET_STAKING_ADDR, WALLET_TOKEN } from '@ambire-common/consts/addresses'

import {
  getMigrateXWalletCalls,
  getStakeWalletCalls,
  getUnstakeWalletCalls,
  getWithdrawWalletCalls
} from './calls'

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

describe('WALLET staking calls', () => {
  test('approves WALLET and enters stkWALLET', () => {
    const amount = parseUnits('12.5', 18)
    const calls = getStakeWalletCalls(amount)

    expect(calls).toHaveLength(2)
    expect(calls[0]?.to).toBe(WALLET_TOKEN)
    expect(walletInterface.decodeFunctionData('approve', calls[0]!.data)).toEqual([
      STK_WALLET,
      amount
    ])
    expect(calls[1]?.to).toBe(STK_WALLET)
    expect(stkWalletInterface.decodeFunctionData('enter', calls[1]!.data)).toEqual([amount])
  })

  test('builds xWALLET approval and migration calls', () => {
    const shares = parseUnits('12.5', 18)
    const calls = getMigrateXWalletCalls(shares)

    expect(calls).toHaveLength(2)
    expect(calls[0]?.to).toBe(WALLET_STAKING_ADDR)
    expect(walletInterface.decodeFunctionData('approve', calls[0]!.data)).toEqual([
      STK_WALLET,
      shares
    ])
    expect(calls[1]?.to).toBe(STK_WALLET)
    expect(stkWalletInterface.decodeFunctionData('wrap', calls[1]!.data)).toEqual([shares])
  })

  test('converts stkWALLET to shares and starts the unstaking period', () => {
    const amount = parseUnits('12.5', 18)
    const shareValue = parseUnits('1.25', 18)
    const calls = getUnstakeWalletCalls(amount, shareValue)
    const expectedShares = parseUnits('10', 18)

    expect(calls).toHaveLength(2)
    expect(calls[0]?.to).toBe(STK_WALLET)
    expect(stkWalletInterface.decodeFunctionData('unwrap', calls[0]!.data)).toEqual([
      expectedShares
    ])
    expect(calls[1]?.to).toBe(WALLET_STAKING_ADDR)
    expect(walletStakingInterface.decodeFunctionData('leave', calls[1]!.data)).toEqual([
      expectedShares,
      false
    ])
  })

  test('rejects an invalid share value', () => {
    expect(() => getUnstakeWalletCalls(1n, 0n)).toThrow(
      'The staking share value must be greater than zero.'
    )
  })

  test('withdraws an unlocked commitment without minting vesting tokens', () => {
    const shares = parseUnits('10', 18)
    const unlocksAt = 2_592_000n
    const calls = getWithdrawWalletCalls(shares, unlocksAt)

    expect(calls).toHaveLength(1)
    expect(calls[0]?.to).toBe(WALLET_STAKING_ADDR)
    expect(walletStakingInterface.decodeFunctionData('withdraw', calls[0]!.data)).toEqual([
      shares,
      unlocksAt,
      true
    ])
  })
})
