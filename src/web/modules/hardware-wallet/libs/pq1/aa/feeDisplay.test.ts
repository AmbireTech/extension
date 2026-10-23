// The device's fee-page rules on its 16-column screen (`write_gwei`,
// `write_gas` and `write_native_fee_budget_row` in
// `pqsigner-erc7730/src/display/primitives.rs` in the firmware repo). A
// figure that fails here is one the device refuses to sign with "render
// refused".

import { Pq1UserError, toUserFacingPq1Error } from '../errors'
import {
  feeBudgetRowFits,
  feePerGasRowFits,
  feeRowsAreExactlyRenderable,
  fitFeesForDeviceDisplay,
  gasRowFits
} from './feeDisplay'
import type { UserOpJson } from './userop'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({
  captureException: jest.fn()
}))

const GWEI = 1_000_000_000n

function opWith(over: Partial<UserOpJson>): UserOpJson {
  return {
    sender: '0x1111111111111111111111111111111111111111',
    nonce: '0x0',
    initCode: '0x',
    callData: '0x',
    callGasLimit: '0x0',
    verificationGasLimit: `0x${800_000n.toString(16)}`,
    preVerificationGas: '0x0',
    maxFeePerGas: '0x0',
    maxPriorityFeePerGas: '0x0',
    paymasterAndData: '0x',
    signature: '0x',
    ...over
  }
}

describe('fee-per-gas row ("<n> gwei" or "<n> wei")', () => {
  it('fits round and dusty sub-gwei values', () => {
    expect(feePerGasRowFits(GWEI)).toBe(true) // "1 gwei"
    expect(feePerGasRowFits(1_000_253n)).toBe(true) // "0.001000253 gwei"
    expect(feePerGasRowFits(2_348_192_837n)).toBe(true) // "2.348192837 gwei"
    expect(feePerGasRowFits(12_348_192_837n)).toBe(true) // falls back to "12348192837 wei"
    expect(feePerGasRowFits(0n)).toBe(true)
  })

  it('refuses values that fit neither form', () => {
    expect(feePerGasRowFits(1_234_567_890_123n)).toBe(false) // 13 digits of wei, 12-digit budget
  })
})

describe('gas row ("(gas: <n>)")', () => {
  it('fits up to nine digits', () => {
    expect(gasRowFits(885_801n)).toBe(true)
    expect(gasRowFits(999_999_999n)).toBe(true)
    expect(gasRowFits(1_000_000_000n)).toBe(false)
  })
})

describe('worst-case budget row ("<maxFee × gas> ETH" or "<wei> wei")', () => {
  it('fits a round fee with dusty gas', () => {
    expect(feeBudgetRowFits(GWEI, 885_801n)).toBe(true) // "0.000885801 ETH"
    expect(feeBudgetRowFits(2_500_000_000n, 885_801n)).toBe(true)
  })

  it('fits a dusty product while it is below 10^12 wei (raw wei form)', () => {
    expect(feeBudgetRowFits(1_000_253n, 885_801n)).toBe(true) // 885825101053 wei
  })

  it('refuses a dusty product at or above 10^12 wei', () => {
    expect(feeBudgetRowFits(10_000_000n, 885_801n)).toBe(false) // 8.85801e12, 13 digits
    expect(feeBudgetRowFits(2_348_192_837n, 885_801n)).toBe(false) // mainnet oracle value
  })

  it('fits any product that is a multiple of 10^8 wei below 10 ETH', () => {
    expect(feeBudgetRowFits(2_348_200_000n, 890_000n)).toBe(true)
    expect(feeBudgetRowFits(1_010_000n, 890_000n)).toBe(true)
  })
})

describe('fitFeesForDeviceDisplay', () => {
  it('returns the op untouched when it already renders exactly', () => {
    const op = opWith({
      callGasLimit: `0x${34_567n.toString(16)}`,
      preVerificationGas: `0x${51_234n.toString(16)}`,
      maxFeePerGas: `0x${GWEI.toString(16)}`,
      maxPriorityFeePerGas: `0x${100_000_000n.toString(16)}`
    })
    expect(fitFeesForDeviceDisplay(op)).toBe(op)
  })

  it('pads callGasLimit and rounds the maxFeePerGas cap up so the budget paints exactly', () => {
    const op = opWith({
      callGasLimit: `0x${34_567n.toString(16)}`,
      preVerificationGas: `0x${51_234n.toString(16)}`,
      maxFeePerGas: `0x${2_348_192_837n.toString(16)}`,
      maxPriorityFeePerGas: `0x${1_000_000_000n.toString(16)}`
    })
    const gasTotal = 800_000n + 34_567n + 51_234n // 885_801
    expect(feeRowsAreExactlyRenderable(2_348_192_837n, 1_000_000_000n, gasTotal)).toBe(false)

    const fitted = fitFeesForDeviceDisplay(op)
    const fittedCallGas = BigInt(fitted.callGasLimit)
    const fittedMaxFee = BigInt(fitted.maxFeePerGas)
    const fittedGasTotal = fittedCallGas + 800_000n + 51_234n

    expect(fittedGasTotal).toBe(890_000n)
    expect(fittedCallGas - 34_567n).toBeLessThan(10_000n)
    expect(fittedMaxFee).toBe(2_348_200_000n)
    expect(fittedMaxFee - 2_348_192_837n).toBeLessThan(10_000n)
    expect(fitted.maxPriorityFeePerGas).toBe(op.maxPriorityFeePerGas) // tip untouched
    expect(fitted.verificationGasLimit).toBe(op.verificationGasLimit)
    expect(fitted.preVerificationGas).toBe(op.preVerificationGas)
    expect(feeRowsAreExactlyRenderable(fittedMaxFee, 1_000_000_000n, fittedGasTotal)).toBe(true)
  })

  it('never lowers a figure', () => {
    const op = opWith({
      callGasLimit: `0x${60_001n.toString(16)}`,
      preVerificationGas: `0x${250_000n.toString(16)}`,
      maxFeePerGas: `0x${1_000_001n.toString(16)}`,
      maxPriorityFeePerGas: `0x${1_000_001n.toString(16)}`
    })
    const fitted = fitFeesForDeviceDisplay(op)
    expect(BigInt(fitted.callGasLimit)).toBeGreaterThanOrEqual(60_001n)
    expect(BigInt(fitted.maxFeePerGas)).toBeGreaterThanOrEqual(1_000_001n)
    expect(BigInt(fitted.maxPriorityFeePerGas)).toBeGreaterThanOrEqual(1_000_001n)
    expect(BigInt(fitted.maxPriorityFeePerGas)).toBeLessThanOrEqual(BigInt(fitted.maxFeePerGas))
  })

  it('refuses in plain language when no rounding can make the pages fit', () => {
    const op = opWith({
      callGasLimit: `0x${1_000_000_000n.toString(16)}`, // 10-digit gas total can never paint
      maxFeePerGas: `0x${GWEI.toString(16)}`,
      maxPriorityFeePerGas: `0x${GWEI.toString(16)}`
    })
    let refusal: unknown
    try {
      fitFeesForDeviceDisplay(op)
    } catch (e) {
      refusal = e
    }
    expect(refusal).toBeInstanceOf(Pq1UserError)
    // The message survives the trip to the user.
    expect(toUserFacingPq1Error(refusal).message).toContain(
      "The PQ1 can't show this network fee on its screen"
    )
  })
})
