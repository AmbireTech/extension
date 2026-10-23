// Fitting a UserOp's fee to the device's screen.
//
// The device refuses to sign a UserOp whose fee it can't show EXACTLY on its
// 16-column screen: it never rounds a figure it signs. A `maxFeePerGas ×
// gasTotal` product with wei-level dust — which is what fee oracles and
// bundler estimates naturally produce — has no exact form that fits, and
// the device refuses with "render refused".
//
// This module applies the device's four checks (the same rules as its fee
// pages, `pqsigner-erc7730/src/display/primitives.rs` in the firmware repo)
// and, when they fail, nudges the two figures that cost the user nothing to
// nudge: `callGasLimit` is a limit (unused gas is refunded) and
// `maxFeePerGas` is a cap (the wallet pays base fee + tip, not the cap).
// Rounding both up to multiples of 10^4 makes the product a multiple of
// 10^8 wei, which always paints as an exact ETH amount with ≤ 10 decimals.

import { Pq1UserError } from '../errors'
import type { UserOpJson } from './userop'

/** Screen width in characters. */
const DISPLAY_COLS = 16n
const GWEI_DECIMALS = 18n - 9n
const ETH_DECIMALS = 18n
const NATIVE_TICKER_LEN = 3n // "ETH" on every chain PQ1 supports
/** Granularity the fitter rounds `callGasLimit`'s gas total and
 *  `maxFeePerGas` up to; their product is then a multiple of 10^8 wei. */
const FIT_GRANULARITY = 10_000n

function decimalDigits(v: bigint): bigint {
  return BigInt(v.toString().length)
}

function trailingDecimalZeros(v: bigint, cap: bigint): bigint {
  let zeros = 0n
  let rest = v
  while (zeros < cap && rest !== 0n && rest % 10n === 0n) {
    rest /= 10n
    zeros += 1n
  }
  return zeros
}

/**
 * Length of `format_decimal(value, decimals, frac, trim_trailing_zeros=true)`
 * when the value is exact at `frac` digits — i.e. its minimal exact decimal
 * form: integer part, then "." and the non-zero fraction digits, if any.
 */
function exactDecimalLength(value: bigint, decimals: bigint): bigint {
  if (value === 0n) return 1n // format_decimal treats zero as exact: "0"
  const intLen = decimalDigits(value / 10n ** decimals)
  const fracLen = decimals - trailingDecimalZeros(value, decimals)
  return fracLen === 0n ? intLen : intLen + 1n + fracLen
}

/** `write_gwei`: a single row "<amount> gwei" (exact, ≤ 9 fraction digits)
 *  or, failing that, "<wei> wei". */
export function feePerGasRowFits(weiPerGas: bigint): boolean {
  if (exactDecimalLength(weiPerGas, GWEI_DECIMALS) + 1n + 4n <= DISPLAY_COLS) return true
  return decimalDigits(weiPerGas) + 1n + 3n <= DISPLAY_COLS
}

/** `write_gas`: "(gas: <n>)" on one row. */
export function gasRowFits(gasTotal: bigint): boolean {
  return 6n + decimalDigits(gasTotal) + 1n <= DISPLAY_COLS
}

/** `write_native_fee_budget_row`: "<maxFee × gas> ETH" exact (≤ 18 fraction
 *  digits) or "<wei> wei". */
export function feeBudgetRowFits(maxFeePerGas: bigint, gasTotal: bigint): boolean {
  const budget = maxFeePerGas * gasTotal
  if (exactDecimalLength(budget, ETH_DECIMALS) + 1n + NATIVE_TICKER_LEN <= DISPLAY_COLS) {
    return true
  }
  return decimalDigits(budget) + 4n <= DISPLAY_COLS
}

/** `legacy_fee_rows_are_exactly_renderable` for a known-ticker chain. */
export function feeRowsAreExactlyRenderable(
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint,
  gasTotal: bigint
): boolean {
  return (
    feePerGasRowFits(maxFeePerGas) &&
    feePerGasRowFits(maxPriorityFeePerGas) &&
    feeBudgetRowFits(maxFeePerGas, gasTotal) &&
    gasRowFits(gasTotal)
  )
}

function roundUpTo(value: bigint, granularity: bigint): bigint {
  const rem = value % granularity
  return rem === 0n ? value : value + (granularity - rem)
}

function hex(v: bigint): `0x${string}` {
  return `0x${v.toString(16)}`
}

/**
 * Return `op` unchanged if the PQ1 can paint its fee pages exactly;
 * otherwise return a copy whose `callGasLimit` and `maxFeePerGas` (and, only
 * if its own row overflows, `maxPriorityFeePerGas`) are rounded UP so that
 * it can. Throws when even the rounded figures cannot be shown — the device
 * would refuse them anyway, and the error names the reason.
 */
export function fitFeesForDeviceDisplay(op: UserOpJson): UserOpJson {
  const callGas = BigInt(op.callGasLimit)
  const verGas = BigInt(op.verificationGasLimit)
  const preVerGas = BigInt(op.preVerificationGas)
  const maxFee = BigInt(op.maxFeePerGas)
  const tip = BigInt(op.maxPriorityFeePerGas)
  const gasTotal = callGas + verGas + preVerGas

  if (feeRowsAreExactlyRenderable(maxFee, tip, gasTotal)) return op

  const fittedGasTotal = roundUpTo(gasTotal, FIT_GRANULARITY)
  const fittedCallGas = callGas + (fittedGasTotal - gasTotal)
  const fittedMaxFee = roundUpTo(maxFee, FIT_GRANULARITY)
  const fittedTip = feePerGasRowFits(tip) ? tip : roundUpTo(tip, FIT_GRANULARITY)

  if (!feeRowsAreExactlyRenderable(fittedMaxFee, fittedTip, fittedGasTotal)) {
    throw new Pq1UserError(
      "The PQ1 can't show this network fee on its screen, so it can't sign it. Try again with a different fee option.",
      `fee rows don't fit the device screen: maxFeePerGas ${fittedMaxFee}, tip ${fittedTip}, gas ${fittedGasTotal}`
    )
  }

  return {
    ...op,
    callGasLimit: hex(fittedCallGas),
    maxFeePerGas: hex(fittedMaxFee),
    maxPriorityFeePerGas: hex(fittedTip)
  }
}
