// Read a Safe transaction from the Safe Transaction Service, for the bundle
// that lets the device show a Safe `approveHash` (see `safeV1Trailer.ts`).
// Nothing read here is trusted: the transaction is hashed and checked
// against the hash being approved, by Ambire and again by the device.

import { isAddress, isHex, zeroAddress } from 'viem'

import { SAFE_API_TIMEOUT_MS } from '@ambire-common/consts/safe'
import { getApiKit } from '@ambire-common/libs/safe/safe'
import { withTimeout } from '@ambire-common/utils/with-timeout'

type SafeMultisigTransactionResponse = Awaited<
  ReturnType<ReturnType<typeof getApiKit>['getTransaction']>
>

/** The fields of a Safe transaction the bundle needs. The API returns u256
 *  values as decimal strings and addresses as 0x-prefixed hex. */
export interface SafeTxFields {
  to: `0x${string}`
  value: bigint
  data: `0x${string}`
  operation: number
  safeTxGas: bigint
  baseGas: bigint
  gasPrice: bigint
  gasToken: `0x${string}`
  refundReceiver: `0x${string}`
  nonce: bigint
  safeTxHash: `0x${string}`
}

/** Fetch the Safe transaction `safeTxHash` on `chainId`. */
export async function fetchSafeTx(
  chainId: number | bigint,
  safeTxHash: `0x${string}`
): Promise<SafeTxFields> {
  const apiKit = getApiKit(BigInt(chainId))
  let raw: SafeMultisigTransactionResponse
  try {
    raw = await withTimeout(() => apiKit.getTransaction(safeTxHash), {
      timeoutMs: SAFE_API_TIMEOUT_MS,
      message: `Safe API: get transaction timed out after ${SAFE_API_TIMEOUT_MS}ms`
    })
  } catch (e) {
    throw new Error(
      `Safe Transaction Service GET ${safeTxHash} failed: ${e instanceof Error ? e.message : String(e)}`
    )
  }
  return parseSafeTx(raw)
}

function parseSafeTx(t: SafeMultisigTransactionResponse): SafeTxFields {
  return {
    to: ensureAddress(t.to, 'to'),
    value: parseU256(t.value, 'value'),
    data: ensureHex(t.data ?? '0x', 'data'),
    operation: ensureOperation(t.operation),
    safeTxGas: parseU256(t.safeTxGas, 'safeTxGas'),
    baseGas: parseU256(t.baseGas, 'baseGas'),
    gasPrice: parseU256(t.gasPrice, 'gasPrice'),
    gasToken: ensureAddress(t.gasToken, 'gasToken'),
    refundReceiver: t.refundReceiver
      ? ensureAddress(t.refundReceiver, 'refundReceiver')
      : zeroAddress,
    nonce: parseU256(t.nonce, 'nonce'),
    safeTxHash: ensureBytes32(t.safeTxHash, 'safeTxHash')
  }
}

function ensureAddress(v: unknown, name: string): `0x${string}` {
  if (typeof v !== 'string' || !isAddress(v, { strict: false })) {
    throw new Error(`${name}: not an address: ${String(v).slice(0, 60)}`)
  }
  return v.toLowerCase() as `0x${string}`
}

function ensureBytes32(v: unknown, name: string): `0x${string}` {
  if (typeof v !== 'string' || !isHex(v, { strict: true }) || v.length !== 2 + 64) {
    throw new Error(`${name}: not a bytes32: ${String(v).slice(0, 80)}`)
  }
  return v.toLowerCase() as `0x${string}`
}

function ensureHex(v: unknown, name: string): `0x${string}` {
  if (typeof v !== 'string' || !isHex(v, { strict: true }) || v.length % 2 !== 0) {
    throw new Error(`${name}: not hex bytes`)
  }
  return v.toLowerCase() as `0x${string}`
}

function parseU256(v: unknown, name: string): bigint {
  if (typeof v === 'number') return BigInt(v)
  if (typeof v !== 'string') throw new Error(`${name}: expected u256 string, got ${typeof v}`)
  try {
    return BigInt(v)
  } catch {
    throw new Error(`${name}: not a u256 string: ${v}`)
  }
}

function ensureOperation(v: unknown): number {
  if (v !== 0 && v !== 1) throw new Error(`operation: expected 0 or 1, got ${String(v)}`)
  return v
}
