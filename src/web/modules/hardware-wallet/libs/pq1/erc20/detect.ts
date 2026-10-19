// Which token an ERC-20 bundle should describe for a call, and the bundle.
//
// The device uses the bundle when a call is an ERC-20 `transfer` /
// `transferFrom` / `approve` and the bundle's (chain, contract) matches the
// token being called, in three shapes:
//
//   1. a direct ERC-20 method call          → contract == call `to`
//   2. a Safe execTransaction / approveHash (op=0) whose
//      inner SafeTx call is an ERC-20 method → contract == SafeTx inner `to`
//   3. a Safe execTransaction multiSend batch
//      with an ERC-20 record (e.g. the CoW
//      approve in an approve+presign batch)  → contract == that record `to`
//
// A call carries one ERC-20 bundle, so it describes the first ERC-20 call
// found (the approve in the CoW multiSend case). Without it the device shows
// the token as unknown, with its raw address and amount; inside a Safe
// transaction it refuses a call to a token it knows needs the bundle.

import { reportClearSigningFallback } from '../db/common'
import { decodeExecTransaction, isSafeExecTransaction } from '../safe/execCalldata'
import { summarizeMultiSend } from '../safe/multiSend'
import { hexToBytes } from '../transport/bytes'
import { loadErc20Db } from './db'
import { isErc20MethodCall } from './selectors'

/** The SafeTx inner call a Safe flow executes: `(operation, to, data)` —
 *  from execTransaction calldata, or from the Safe Transaction Service entry
 *  behind an approveHash (whose trailer the device re-verifies). */
export type SafeTxInnerCall = {
  operation: number
  to: `0x${string}`
  data: Uint8Array
}

/** The token an ERC-20 bundle should describe for a SafeTx inner call: the
 *  inner `to` when it is an ERC-20 method (operation 0), else the first
 *  ERC-20 record of an allowlisted MultiSendCallOnly batch (the approve in a
 *  CoW approve+presign batch). A reject banner (string) yields no token. */
export function resolveSafeTxErc20Token(inner: SafeTxInnerCall): Uint8Array | null {
  if (inner.operation === 0) {
    return isErc20MethodCall(inner.data) ? hexToBytes(inner.to) : null
  }
  const summary = summarizeMultiSend(inner.data)
  if (typeof summary === 'string') return null
  for (const rec of summary.records) {
    if (isErc20MethodCall(rec.data)) return hexToBytes(rec.to)
  }
  return null
}

/** The 20-byte token address the ERC-20 bundle should describe for this
 *  inner call, or null when no inner call is an ERC-20 method (native
 *  transfer, contract call, CoW presign, etc.). An approveHash is resolved
 *  by the caller from its fetched SafeTx (`resolveSafeTxErc20Token`). */
function resolveErc20Token(to: `0x${string}`, data: Uint8Array): Uint8Array | null {
  if (isErc20MethodCall(data)) return hexToBytes(to)
  if (!isSafeExecTransaction(data)) return null
  const exec = decodeExecTransaction(data)
  return exec ? resolveSafeTxErc20Token(exec) : null
}

/** The ERC-20 bundle for `token` on `chainId`, or undefined when the token
 *  isn't in the catalog or the catalog fails to load. Never throws. */
export async function buildErc20BundleFor(
  chainId: number | bigint,
  token: Uint8Array
): Promise<Uint8Array | undefined> {
  try {
    const db = await loadErc20Db()
    return db.buildBundle(chainId, token) ?? undefined
  } catch (e) {
    reportClearSigningFallback('ERC-20 bundle lookup failed; rendering unknown-token', e)
    return undefined
  }
}

/** The ERC-20 bundle for a call, or undefined when the call isn't an ERC-20
 *  method, the token isn't in the catalog, or the catalog fails to load.
 *  Never throws. */
export async function resolveErc20Bundle(
  chainId: number | bigint,
  to: `0x${string}`,
  data: Uint8Array
): Promise<Uint8Array | undefined> {
  const token = resolveErc20Token(to, data)
  return token ? buildErc20BundleFor(chainId, token) : undefined
}

/** The ERC-20 bundle for the first of `tokens` the catalog knows, or
 *  undefined. Used for the tokens an ERC-7730 descriptor's amounts are in
 *  (wstETH `wrap` → stETH, Aave `supply(asset, …)` → the asset): without it
 *  the device shows the amount unscaled, and can't show a summary that
 *  names it ("Wrap 1 stETH") at all. */
export async function firstKnownErc20Bundle(
  chainId: number | bigint,
  tokens: readonly Uint8Array[]
): Promise<Uint8Array | undefined> {
  for (const token of tokens) {
    const bundle = await buildErc20BundleFor(chainId, token)
    if (bundle) return bundle
  }
  return undefined
}
