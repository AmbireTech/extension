// The canonical Permit2 permit: the packed layout a kind-6 SIGN_OFFCHAIN
// payload starts with. Every field has its Solidity width, so a value its
// EIP-712 type can't hold can't be encoded. The device decodes the permit,
// shows it and recomputes its EIP-712 digest from it. All integers are
// big-endian.
//
// Allowance (PermitSingle, PermitBatch):
//   [ 0]       variant      0 / 1
//   [ 1.. 9)   chainId      u64
//   [ 9..29)   spender      20-byte address
//   [29..61)   sigDeadline  u256
//   [61]       count        1 for PermitSingle, 1..6 for PermitBatch
//   then count × { token (20 B), amount u160, expiration u48, nonce u48 }
//
// Transfer (PermitTransferFrom, PermitBatchTransferFrom):
//   [ 0]       variant      2 / 3
//   [ 1.. 9)   chainId      u64
//   [ 9..29)   spender      20-byte address
//   [29..61)   nonce        u256
//   [61..93)   deadline     u256
//   [93]       count        1 for PermitTransferFrom, 1..6 for the batch
//   then count × { token (20 B), amount u256 }

import {
  PERMIT2_ALLOWANCE_HEAD_LEN,
  PERMIT2_ENTRY_LEN,
  PERMIT2_MAX_TOKENS,
  PERMIT2_TRANSFER_HEAD_LEN,
  PERMIT2_VARIANT_BATCH,
  PERMIT2_VARIANT_BATCH_TRANSFER,
  PERMIT2_VARIANT_SINGLE,
  PERMIT2_VARIANT_TRANSFER
} from '../config'
import { addressBytes, concatBytes } from '../transport/bytes'

type Hex = `0x${string}`

export type Permit2AllowanceVariant = typeof PERMIT2_VARIANT_SINGLE | typeof PERMIT2_VARIANT_BATCH
export type Permit2TransferVariant =
  | typeof PERMIT2_VARIANT_TRANSFER
  | typeof PERMIT2_VARIANT_BATCH_TRANSFER
export type Permit2Variant = Permit2AllowanceVariant | Permit2TransferVariant

/** A token of an allowance permit (Permit2's `PermitDetails`). */
export type Permit2AllowanceToken = {
  token: Hex
  /** uint160; `2^160 - 1` is an unlimited allowance. */
  amount: bigint
  /** uint48 Unix time; 0 makes the allowance last only for the block it is
   *  used in. */
  expiration: bigint
  /** uint48, the token's allowance nonce. */
  nonce: bigint
}

/** A token of a transfer permit (Permit2's `TokenPermissions`): the most
 *  the spender may pull, once. */
export type Permit2TransferToken = { token: Hex; amount: bigint }

/** A PermitSingle or PermitBatch: an allowance the spender can use until
 *  it expires. */
export type Permit2Allowance = {
  variant: Permit2AllowanceVariant
  chainId: bigint
  spender: Hex
  sigDeadline: bigint
  tokens: Permit2AllowanceToken[]
}

/** A PermitTransferFrom or PermitBatchTransferFrom: a one-time pull by the
 *  spender, which picks the recipient and an amount up to each token's. */
export type Permit2Transfer = {
  variant: Permit2TransferVariant
  chainId: bigint
  spender: Hex
  /** uint256, the SignatureTransfer nonce. */
  nonce: bigint
  deadline: bigint
  tokens: Permit2TransferToken[]
}

/** A Permit2 permit, field for field as its EIP-712 type has it. */
export type Permit2 = Permit2Allowance | Permit2Transfer

export const isAllowanceVariant = (variant: Permit2Variant): variant is Permit2AllowanceVariant =>
  variant === PERMIT2_VARIANT_SINGLE || variant === PERMIT2_VARIANT_BATCH

export const isAllowancePermit = (p: Permit2): p is Permit2Allowance =>
  isAllowanceVariant(p.variant)

export const isBatchVariant = (variant: Permit2Variant): boolean =>
  variant === PERMIT2_VARIANT_BATCH || variant === PERMIT2_VARIANT_BATCH_TRANSFER

/** True when a permit of `variant` may name `count` tokens: exactly 1 for
 *  the single variants, 1 to `PERMIT2_MAX_TOKENS` for the batch ones. */
const isTokenCountAllowed = (variant: Permit2Variant, count: number): boolean =>
  isBatchVariant(variant) ? count >= 1 && count <= PERMIT2_MAX_TOKENS : count === 1

const isPermit2Variant = (byte: number | undefined): byte is Permit2Variant =>
  byte === PERMIT2_VARIANT_SINGLE ||
  byte === PERMIT2_VARIANT_BATCH ||
  byte === PERMIT2_VARIANT_TRANSFER ||
  byte === PERMIT2_VARIANT_BATCH_TRANSFER

/** `value` as `byteLen` big-endian bytes. Throws when it doesn't fit, so a
 *  field is never silently truncated to its width. */
function uintBe(value: bigint, byteLen: number, field: string): Uint8Array {
  if (value < 0n || value >= 1n << BigInt(8 * byteLen)) {
    throw new Error(`permit2: ${field} doesn't fit in ${8 * byteLen} bits`)
  }
  const out = new Uint8Array(byteLen)
  let rest = value
  for (let i = byteLen - 1; i >= 0; i--) {
    out[i] = Number(rest & 0xffn)
    rest >>= 8n
  }
  return out
}

/** Encode `p` in the canonical layout. Throws on a value out of its
 *  field's range or a token count its variant doesn't allow. */
export function encodePermit2Canonical(p: Permit2): Uint8Array {
  const count = p.tokens.length
  if (!isTokenCountAllowed(p.variant, count)) {
    throw new Error(`permit2: variant ${p.variant} can't name ${count} tokens`)
  }
  const head = [
    new Uint8Array([p.variant]),
    uintBe(p.chainId, 8, 'chainId'),
    addressBytes(p.spender)
  ]
  if (isAllowancePermit(p)) {
    return concatBytes([
      ...head,
      uintBe(p.sigDeadline, 32, 'sigDeadline'),
      new Uint8Array([count]),
      ...p.tokens.flatMap((t) => [
        addressBytes(t.token),
        uintBe(t.amount, 20, 'amount'),
        uintBe(t.expiration, 6, 'expiration'),
        uintBe(t.nonce, 6, 'nonce')
      ])
    ])
  }
  return concatBytes([
    ...head,
    uintBe(p.nonce, 32, 'nonce'),
    uintBe(p.deadline, 32, 'deadline'),
    new Uint8Array([count]),
    ...p.tokens.flatMap((t) => [addressBytes(t.token), uintBe(t.amount, 32, 'amount')])
  ])
}

/** The variant and token count of a canonical permit, after checking its
 *  framing the way the device does: a known variant, a token count the
 *  variant allows, and nothing after the last token. */
export function readPermit2Framing(canonical: Uint8Array): {
  variant: Permit2Variant
  count: number
} {
  const variant = canonical[0]
  if (!isPermit2Variant(variant)) throw new Error(`permit2: unknown variant ${variant}`)
  const headLen = isAllowanceVariant(variant)
    ? PERMIT2_ALLOWANCE_HEAD_LEN
    : PERMIT2_TRANSFER_HEAD_LEN
  const count = canonical[headLen - 1] ?? 0
  if (!isTokenCountAllowed(variant, count)) {
    throw new Error(`permit2: variant ${variant} can't name ${count} tokens`)
  }
  if (canonical.length !== headLen + count * PERMIT2_ENTRY_LEN) {
    throw new Error(
      `permit2: a canonical permit of ${count} tokens can't be ${canonical.length} bytes`
    )
  }
  return { variant, count }
}
