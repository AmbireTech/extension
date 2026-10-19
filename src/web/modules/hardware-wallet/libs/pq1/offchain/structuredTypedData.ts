// Recognise the two EIP-712 shapes the PQ1 can clear-sign off-chain without
// an ERC-7730 descriptor: a Safe `SafeTx` (SIGN_OFFCHAIN kind 4) and a CoW
// Protocol `Order` (kind 5). The device recomputes the EIP-712 hash from the
// canonical fields it shows, so Ambire only routes typed data here when
// those fields reproduce the dapp's hash exactly:
//
//   - the domain carries exactly the keys the device's domain encodes
//     (Safe ≥ v1.3.0: `{chainId, verifyingContract}`; CoW: `{name, version,
//     chainId, verifyingContract}` pinned to GPv2Settlement);
//   - the primary type's field list is exactly the canonical one, in order;
//   - the hash rebuilt from the canonical fields equals viem's
//     `hashTypedData` of the request.
//
// Anything else is `other` and keeps the descriptor / blind-hash routing.
// A shape the device would hash differently could never verify against
// the real Safe or settlement anyway, so `other` loses nothing.

import {
  getAddress,
  hashTypedData,
  isAddress,
  isHex,
  maxUint256,
  type TypedDataDefinition
} from 'viem'

import { computeOrderDigest, GPV2_SETTLEMENT_ADDRESS } from '../cowswap/eip712'
import type { BuyTokenBalance, GPv2Order, OrderKind, SellTokenBalance } from '../cowswap/types'
import { encodeSafeCanonical, safeDataHash, type SafeCanonical } from '../safe/canonical'
import { computeSafeTxHash } from '../safe/eip712'
import { hexToBytes, isSameBytes } from '../transport/bytes'

type Hex = `0x${string}`
type TypedField = { name: string; type: string }

/** The typed-data request as Ambire hands it over (ethers-style). The
 *  domain is read as a plain object (ethers' `TypedDataDomain`). */
export type StructuredTypedDataInput = {
  domain?: object | null
  types: Record<string, readonly TypedField[]>
  primaryType: string
  message: Record<string, unknown>
}

/** What a typed-data request is, for the device. */
export type StructuredTypedData =
  | {
      kind: 'safe_tx'
      chainId: bigint
      /** The Safe (domain `verifyingContract`). */
      safe: Hex
      canonical: SafeCanonical
      /** The SafeTx `data` the canonical's `dataHash` commits to. */
      rawData: Uint8Array
      /** `safeTxHash` — the EIP-712 hash the dapp asked to sign. */
      digest: Uint8Array
    }
  | {
      kind: 'cow_order'
      chainId: bigint
      order: GPv2Order
      /** The GPv2 order digest — the EIP-712 hash the dapp asked to sign. */
      digest: Uint8Array
    }
  | { kind: 'other' }

const OTHER = { kind: 'other' } as const

/** Safe ≥ v1.3.0 `SafeTx` fields, in typehash order. */
const SAFE_TX_FIELDS: readonly TypedField[] = [
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'data', type: 'bytes' },
  { name: 'operation', type: 'uint8' },
  { name: 'safeTxGas', type: 'uint256' },
  { name: 'baseGas', type: 'uint256' },
  { name: 'gasPrice', type: 'uint256' },
  { name: 'gasToken', type: 'address' },
  { name: 'refundReceiver', type: 'address' },
  { name: 'nonce', type: 'uint256' }
]

/** The Safe ≥ v1.3.0 domain: `EIP712Domain(uint256 chainId,address verifyingContract)`. */
const SAFE_DOMAIN_FIELDS: readonly TypedField[] = [
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]

/** GPv2 `Order` fields, in typehash order (enums as `string`). */
const COW_ORDER_FIELDS: readonly TypedField[] = [
  { name: 'sellToken', type: 'address' },
  { name: 'buyToken', type: 'address' },
  { name: 'receiver', type: 'address' },
  { name: 'sellAmount', type: 'uint256' },
  { name: 'buyAmount', type: 'uint256' },
  { name: 'validTo', type: 'uint32' },
  { name: 'appData', type: 'bytes32' },
  { name: 'feeAmount', type: 'uint256' },
  { name: 'kind', type: 'string' },
  { name: 'partiallyFillable', type: 'bool' },
  { name: 'sellTokenBalance', type: 'string' },
  { name: 'buyTokenBalance', type: 'string' }
]

const COW_DOMAIN_FIELDS: readonly TypedField[] = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]

const COW_DOMAIN_NAME = 'Gnosis Protocol'
const COW_DOMAIN_VERSION = 'v2'
const UINT32_MAX = 0xffffffffn

/** Which device-clear-signable shape `typedData` is, with the canonical
 *  fields the device will show and re-hash. Never throws. */
export function classifyStructuredTypedData(
  typedData: StructuredTypedDataInput
): StructuredTypedData {
  try {
    if (typedData.primaryType === 'SafeTx') return classifySafeTx(typedData)
    if (typedData.primaryType === 'Order') return classifyCowOrder(typedData)
  } catch (e) {
    // A field that doesn't parse is a shape the device can't re-hash; the
    // request takes the other routes.
    console.warn('[pq1] typed data looks like a SafeTx / CoW order but does not parse', e)
  }
  return OTHER
}

function classifySafeTx(td: StructuredTypedDataInput): StructuredTypedData {
  const domain = presentKeys(td.domain)
  if (!sameKeys(domain, ['chainId', 'verifyingContract'])) return OTHER
  if (!exactTypes(td.types, 'SafeTx', SAFE_TX_FIELDS, SAFE_DOMAIN_FIELDS)) return OTHER
  if (
    !sameKeys(
      td.message,
      SAFE_TX_FIELDS.map((f) => f.name)
    )
  )
    return OTHER

  const chainId = uint(domain.chainId)
  const safe = address(domain.verifyingContract)
  const m = td.message
  const rawData = bytes(m.data)
  const operation = Number(uint(m.operation))
  if (operation !== 0 && operation !== 1) return OTHER
  const canonical: SafeCanonical = {
    chainId,
    safeAddress: safe,
    to: address(m.to),
    value: uint(m.value),
    dataHash: safeDataHash(rawData),
    operation,
    safeTxGas: uint(m.safeTxGas),
    baseGas: uint(m.baseGas),
    gasPrice: uint(m.gasPrice),
    gasToken: address(m.gasToken),
    refundReceiver: address(m.refundReceiver),
    nonce: uint(m.nonce)
  }
  encodeSafeCanonical(canonical) // u64 chain id and field widths
  const digest = computeSafeTxHash(canonical)
  if (!matchesViemHash(td, digest)) return OTHER
  return { kind: 'safe_tx', chainId, safe, canonical, rawData, digest }
}

function classifyCowOrder(td: StructuredTypedDataInput): StructuredTypedData {
  const domain = presentKeys(td.domain)
  if (!sameKeys(domain, ['name', 'version', 'chainId', 'verifyingContract'])) return OTHER
  if (domain.name !== COW_DOMAIN_NAME || domain.version !== COW_DOMAIN_VERSION) return OTHER
  if (address(domain.verifyingContract).toLowerCase() !== GPV2_SETTLEMENT_ADDRESS.toLowerCase()) {
    return OTHER
  }
  if (!exactTypes(td.types, 'Order', COW_ORDER_FIELDS, COW_DOMAIN_FIELDS)) return OTHER
  if (
    !sameKeys(
      td.message,
      COW_ORDER_FIELDS.map((f) => f.name)
    )
  )
    return OTHER

  const chainId = uint(domain.chainId)
  if (chainId > BigInt(Number.MAX_SAFE_INTEGER)) return OTHER
  const m = td.message
  const validTo = uint(m.validTo)
  const appData = bytes(m.appData)
  const kind = oneOf<OrderKind>(m.kind, ['sell', 'buy'])
  const sellTokenBalance = oneOf<SellTokenBalance>(m.sellTokenBalance, [
    'erc20',
    'external',
    'internal'
  ])
  const buyTokenBalance = oneOf<BuyTokenBalance>(m.buyTokenBalance, ['erc20', 'internal'])
  if (validTo > UINT32_MAX || appData.length !== 32 || typeof m.partiallyFillable !== 'boolean') {
    return OTHER
  }
  if (!kind || !sellTokenBalance || !buyTokenBalance) return OTHER
  const order: GPv2Order = {
    chainId: Number(chainId),
    sellToken: address(m.sellToken),
    buyToken: address(m.buyToken),
    receiver: address(m.receiver),
    sellAmount: uint(m.sellAmount),
    buyAmount: uint(m.buyAmount),
    validTo: Number(validTo),
    appData,
    feeAmount: uint(m.feeAmount),
    kind,
    partiallyFillable: m.partiallyFillable,
    sellTokenBalance,
    buyTokenBalance
  }
  const digest = computeOrderDigest(order)
  if (!matchesViemHash(td, digest)) return OTHER
  return { kind: 'cow_order', chainId, order, digest }
}

/** The dapp's own hash of the request, by an independent implementation. */
function matchesViemHash(td: StructuredTypedDataInput, digest: Uint8Array): boolean {
  const viemHash = hashTypedData(td as unknown as TypedDataDefinition)
  return isSameBytes(hexToBytes(viemHash), digest)
}

/** `obj` without its `undefined` / `null` entries (viem treats an absent
 *  domain field and an `undefined` one the same). */
function presentKeys(obj: object | null | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj ?? {})) if (v !== undefined && v !== null) out[k] = v
  return out
}

function sameKeys(obj: Record<string, unknown>, keys: readonly string[]): boolean {
  const present = Object.keys(obj)
  return present.length === keys.length && keys.every((k) => k in obj)
}

/** `types` holds exactly the primary type (with exactly `fields`) and,
 *  optionally, an `EIP712Domain` equal to `domainFields`. */
function exactTypes(
  types: Record<string, readonly TypedField[]>,
  primaryType: string,
  fields: readonly TypedField[],
  domainFields: readonly TypedField[]
): boolean {
  const names = Object.keys(types)
  const expected = 'EIP712Domain' in types ? [primaryType, 'EIP712Domain'] : [primaryType]
  if (names.length !== expected.length || !expected.every((n) => n in types)) return false
  if (!sameFields(types[primaryType], fields)) return false
  return !('EIP712Domain' in types) || sameFields(types.EIP712Domain, domainFields)
}

function sameFields(got: readonly TypedField[] | undefined, want: readonly TypedField[]): boolean {
  return (
    !!got &&
    got.length === want.length &&
    got.every((f, i) => f.name === want[i]!.name && f.type === want[i]!.type)
  )
}

const isDecimalDigits = (v: string) =>
  v.length > 0 && Array.from(v).every((ch) => ch >= '0' && ch <= '9')

/** A uint256 given as a bigint, a safe integer, a decimal string or a hex
 *  string. */
function uint(v: unknown): bigint {
  let n: bigint
  if (typeof v === 'bigint') n = v
  else if (typeof v === 'number' && Number.isSafeInteger(v)) n = BigInt(v)
  else if (typeof v === 'string' && (isDecimalDigits(v) || (isHex(v) && v.length > 2))) {
    n = BigInt(v)
  } else throw new Error('not an unsigned integer')
  if (n < 0n || n > maxUint256) throw new Error('out of uint256 range')
  return n
}

function address(v: unknown): Hex {
  if (typeof v !== 'string' || !isAddress(v, { strict: false })) throw new Error('not an address')
  return getAddress(v) as Hex
}

function bytes(v: unknown): Uint8Array {
  if (typeof v !== 'string' || !isHex(v)) throw new Error('not hex bytes')
  return hexToBytes(v)
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : null
}
