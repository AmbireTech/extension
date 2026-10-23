// Recognise the EIP-712 shapes the PQ1 can clear-sign off-chain without an
// ERC-7730 descriptor: a Safe `SafeTx` (SIGN_OFFCHAIN kind 4), a CoW
// Protocol `Order` (kind 5) and a Uniswap Permit2 permit (kind 6:
// PermitSingle, PermitBatch, PermitTransferFrom, PermitBatchTransferFrom).
// The device recomputes the EIP-712 hash from the canonical fields it
// shows, so Ambire only routes typed data here when those fields reproduce
// the dapp's hash exactly:
//
//   - the domain carries exactly the keys the device's domain encodes
//     (Safe ≥ v1.3.0: `{chainId, verifyingContract}`; CoW: `{name, version,
//     chainId, verifyingContract}` pinned to GPv2Settlement; Permit2:
//     `{name, chainId, verifyingContract}` pinned to the Permit2 contract);
//   - the primary type's field list is exactly the canonical one, in order,
//     and so is that of each struct it nests;
//   - the hash rebuilt from the canonical fields equals viem's
//     `hashTypedData` of the request.
//
// Anything else is `other` and keeps the descriptor / blind-hash routing.
// A shape the device would hash differently could never verify against
// the real Safe, settlement or Permit2 contract anyway, so `other` loses
// nothing. A Permit2 permit the device would refuse (see `permit2Refusal`)
// is `refused`: it is refused, not signed as its hash.

import {
  getAddress,
  hashTypedData,
  isAddress,
  isHex,
  maxUint160,
  maxUint256,
  maxUint48,
  maxUint64,
  type TypedDataDefinition,
  zeroAddress
} from 'viem'

import {
  PERMIT2_MAX_TOKENS,
  PERMIT2_VARIANT_BATCH,
  PERMIT2_VARIANT_BATCH_TRANSFER,
  PERMIT2_VARIANT_SINGLE,
  PERMIT2_VARIANT_TRANSFER
} from '../config'
import { computeOrderDigest, GPV2_SETTLEMENT_ADDRESS } from '../cowswap/eip712'
import type { BuyTokenBalance, GPv2Order, OrderKind, SellTokenBalance } from '../cowswap/types'
import {
  encodePermit2Canonical,
  isAllowanceVariant,
  isBatchVariant,
  type Permit2,
  type Permit2AllowanceToken,
  type Permit2TransferToken,
  type Permit2Variant
} from '../permit2/canonical'
import { computePermit2Digest, PERMIT2_ADDRESS } from '../permit2/eip712'
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
  | {
      kind: 'permit2'
      chainId: bigint
      permit: Permit2
      /** The canonical permit (`permit2/canonical.ts`) the device decodes. */
      canonical: Uint8Array
      /** The permit digest — the EIP-712 hash the dapp asked to sign. */
      digest: Uint8Array
    }
  | {
      /** A shape the device clear-signs, in a form it refuses (a Permit2
       *  permit naming the same token twice, for example). It is refused
       *  with `message`, never signed as its hash. */
      kind: 'refused'
      chainId: bigint
      message: string
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

/** The Permit2 domain: `EIP712Domain(string name,uint256 chainId,address verifyingContract)`. */
const PERMIT2_DOMAIN_FIELDS: readonly TypedField[] = [
  { name: 'name', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]
const PERMIT2_DOMAIN_NAME = 'Permit2'

/** Permit2 `PermitDetails` fields, in typehash order. */
const PERMIT_DETAILS_FIELDS: readonly TypedField[] = [
  { name: 'token', type: 'address' },
  { name: 'amount', type: 'uint160' },
  { name: 'expiration', type: 'uint48' },
  { name: 'nonce', type: 'uint48' }
]
/** Permit2 `TokenPermissions` fields, in typehash order. */
const TOKEN_PERMISSIONS_FIELDS: readonly TypedField[] = [
  { name: 'token', type: 'address' },
  { name: 'amount', type: 'uint256' }
]

/** A Permit2 primary type: its variant byte, its fields in typehash order
 *  and the struct it nests in `memberField` (an array of them for a batch). */
type Permit2Shape = {
  variant: Permit2Variant
  fields: readonly TypedField[]
  memberField: string
  memberType: string
  memberFields: readonly TypedField[]
}

const PERMIT2_SHAPES = new Map<string, Permit2Shape>([
  [
    'PermitSingle',
    {
      variant: PERMIT2_VARIANT_SINGLE,
      fields: [
        { name: 'details', type: 'PermitDetails' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' }
      ],
      memberField: 'details',
      memberType: 'PermitDetails',
      memberFields: PERMIT_DETAILS_FIELDS
    }
  ],
  [
    'PermitBatch',
    {
      variant: PERMIT2_VARIANT_BATCH,
      fields: [
        { name: 'details', type: 'PermitDetails[]' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' }
      ],
      memberField: 'details',
      memberType: 'PermitDetails',
      memberFields: PERMIT_DETAILS_FIELDS
    }
  ],
  [
    'PermitTransferFrom',
    {
      variant: PERMIT2_VARIANT_TRANSFER,
      fields: [
        { name: 'permitted', type: 'TokenPermissions' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ],
      memberField: 'permitted',
      memberType: 'TokenPermissions',
      memberFields: TOKEN_PERMISSIONS_FIELDS
    }
  ],
  [
    'PermitBatchTransferFrom',
    {
      variant: PERMIT2_VARIANT_BATCH_TRANSFER,
      fields: [
        { name: 'permitted', type: 'TokenPermissions[]' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ],
      memberField: 'permitted',
      memberType: 'TokenPermissions',
      memberFields: TOKEN_PERMISSIONS_FIELDS
    }
  ]
])

/** Which device-clear-signable shape `typedData` is, with the canonical
 *  fields the device will show and re-hash. Never throws. */
export function classifyStructuredTypedData(
  typedData: StructuredTypedDataInput
): StructuredTypedData {
  try {
    if (typedData.primaryType === 'SafeTx') return classifySafeTx(typedData)
    if (typedData.primaryType === 'Order') return classifyCowOrder(typedData)
    const permit2Shape = PERMIT2_SHAPES.get(typedData.primaryType)
    if (permit2Shape) return classifyPermit2(typedData, permit2Shape)
  } catch (e) {
    // A field that doesn't parse is a shape the device can't re-hash; the
    // request takes the other routes.
    console.warn(
      '[pq1] typed data looks like a SafeTx / CoW order / Permit2 permit but does not parse',
      e
    )
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

function classifyPermit2(td: StructuredTypedDataInput, shape: Permit2Shape): StructuredTypedData {
  const domain = presentKeys(td.domain)
  if (!sameKeys(domain, ['name', 'chainId', 'verifyingContract'])) return OTHER
  if (domain.name !== PERMIT2_DOMAIN_NAME) return OTHER
  if (address(domain.verifyingContract).toLowerCase() !== PERMIT2_ADDRESS.toLowerCase()) {
    return OTHER
  }
  const nested = { [shape.memberType]: shape.memberFields }
  if (!exactTypes(td.types, td.primaryType, shape.fields, PERMIT2_DOMAIN_FIELDS, nested)) {
    return OTHER
  }
  if (
    !sameKeys(
      td.message,
      shape.fields.map((f) => f.name)
    )
  )
    return OTHER

  const chainId = uint(domain.chainId)
  if (chainId > maxUint64) return OTHER
  const m = td.message
  const member = m[shape.memberField]
  const members = isBatchVariant(shape.variant) ? member : [member]
  if (!Array.isArray(members)) return OTHER
  const permit: Permit2 = isAllowanceVariant(shape.variant)
    ? {
        variant: shape.variant,
        chainId,
        spender: address(m.spender),
        sigDeadline: uint(m.sigDeadline),
        tokens: members.map(permitDetails)
      }
    : {
        variant: shape.variant,
        chainId,
        spender: address(m.spender),
        nonce: uint(m.nonce),
        deadline: uint(m.deadline),
        tokens: members.map(tokenPermissions)
      }

  const refusal = permit2Refusal(permit)
  if (refusal) return { kind: 'refused', chainId, message: refusal }
  const digest = computePermit2Digest(permit)
  if (!matchesViemHash(td, digest)) return OTHER
  return { kind: 'permit2', chainId, permit, canonical: encodePermit2Canonical(permit), digest }
}

/** Why the device would refuse `p`, in words for the user, or null: too
 *  many tokens to show, a token named twice (which it can't show
 *  unambiguously), or an empty address (which can't be valid). */
function permit2Refusal(p: Permit2): string | null {
  const count = p.tokens.length
  if (count === 0) return 'This Permit2 signature names no token. Nothing was signed.'
  if (count > PERMIT2_MAX_TOKENS) {
    return `This Permit2 signature covers ${count} tokens, and a PQ1 can show at most ${PERMIT2_MAX_TOKENS} in one signature. Nothing was signed.`
  }
  const tokens = p.tokens.map((t) => t.token.toLowerCase())
  if (new Set(tokens).size !== count) {
    return "This Permit2 signature names the same token more than once, so a PQ1 can't show clearly what it allows. Nothing was signed."
  }
  if ([p.spender.toLowerCase(), ...tokens].includes(zeroAddress)) {
    return "This Permit2 signature names an empty address (0x0000…0000) where a token or an app should be, so it can't be valid. Nothing was signed."
  }
  return null
}

function permitDetails(v: unknown): Permit2AllowanceToken {
  const o = structOf(v, PERMIT_DETAILS_FIELDS)
  const details = {
    token: address(o.token),
    amount: uint(o.amount),
    expiration: uint(o.expiration),
    nonce: uint(o.nonce)
  }
  if (details.amount > maxUint160 || details.expiration > maxUint48 || details.nonce > maxUint48) {
    throw new Error('PermitDetails field out of range')
  }
  return details
}

function tokenPermissions(v: unknown): Permit2TransferToken {
  const o = structOf(v, TOKEN_PERMISSIONS_FIELDS)
  return { token: address(o.token), amount: uint(o.amount) }
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

/** `types` holds exactly the primary type (with exactly `fields`), the
 *  structs it nests (`nested`: name → exact fields) and, optionally, an
 *  `EIP712Domain` equal to `domainFields`. */
function exactTypes(
  types: Record<string, readonly TypedField[]>,
  primaryType: string,
  fields: readonly TypedField[],
  domainFields: readonly TypedField[],
  nested: Record<string, readonly TypedField[]> = {}
): boolean {
  const names = Object.keys(types)
  const expected = [
    primaryType,
    ...Object.keys(nested),
    ...('EIP712Domain' in types ? ['EIP712Domain'] : [])
  ]
  if (names.length !== expected.length || !expected.every((n) => n in types)) return false
  if (!sameFields(types[primaryType], fields)) return false
  if (!Object.entries(nested).every(([name, f]) => sameFields(types[name], f))) return false
  return !('EIP712Domain' in types) || sameFields(types.EIP712Domain, domainFields)
}

/** `v` as a struct with exactly the keys of `fields`. */
function structOf(v: unknown, fields: readonly TypedField[]): Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error('not a struct')
  const struct = v as Record<string, unknown>
  if (
    !sameKeys(
      struct,
      fields.map((f) => f.name)
    )
  ) {
    throw new Error('not the expected struct')
  }
  return struct
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
