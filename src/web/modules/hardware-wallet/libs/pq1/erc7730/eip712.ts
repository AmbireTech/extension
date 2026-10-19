// The three parts of an EIP-712 request the device needs to show it with an
// ERC-7730 descriptor (SIGN_OFFCHAIN kind 2):
//   1. `domain_separator = keccak256(EIP712Domain typehash || encode(domain))`
//   2. `primary_type_hash = keccak256(encodeType(types, primaryType))`
//   3. `encoded_data       = encodeAbiParameters(types[primaryType], message)`
//
// `encoded_data` is the struct body only; the device prepends the type hash.
//
// viem's `encodeAbiParameters` doesn't apply EIP-712's rules for dynamic
// fields (strings and bytes are hashed, nested structs are hashed
// recursively, arrays are hashed), so its output equals the EIP-712 struct
// body only for messages of static fields (address, uintN, intN, bytesN,
// bool). Other messages (Permit2's nested types, for example) get no parts
// here, and the signer signs their EIP-712 hash blind.

import { encodeAbiParameters, hashDomain, keccak256, toBytes } from 'viem'

import { hexToBytes } from '../transport/bytes'

export type TypedDataDomain = {
  name?: string
  version?: string
  chainId?: number | bigint
  verifyingContract?: `0x${string}`
  salt?: `0x${string}`
}

export type TypedDataField = { name: string; type: string }
export type TypedDataTypes = Record<string, readonly TypedDataField[]>

export interface Erc7730Eip712Pieces {
  domainSeparator: Uint8Array
  primaryTypeHash: Uint8Array
  encodedData: Uint8Array
}

/** Parse the decimal suffix of a sized type (`uint256` → 256). Returns
 *  null on a non-numeric or leading-zero suffix so `uint0x8`, `uint08`
 *  and friends are rejected exactly like the ABI grammar rejects them. */
function parseSizeSuffix(suffix: string): number | null {
  if (suffix.length === 0 || suffix.length > 3) return null
  if (suffix[0] === '0') return null
  let n = 0
  for (let i = 0; i < suffix.length; i++) {
    const c = suffix.charCodeAt(i)
    if (c < 0x30 || c > 0x39) return null
    n = n * 10 + (c - 0x30)
  }
  return n
}

/** Field types whose `encodeAbiParameters` encoding is also their EIP-712
 *  encoding: `address`, `bool`, `uintN`/`intN` (N a multiple of 8, ≤ 256,
 *  or omitted) and `bytesN` (1 ≤ N ≤ 32). Anything else — dynamic
 *  `bytes`/`string`, arrays, nested structs — sends the message to the
 *  blind-hash route instead. */
function isStaticAtomicType(t: string): boolean {
  if (t === 'address' || t === 'bool') return true
  if (t === 'uint' || t === 'int') return true
  if (t.startsWith('uint') || t.startsWith('int')) {
    const bits = parseSizeSuffix(t.slice(t.startsWith('uint') ? 4 : 3))
    return bits !== null && bits % 8 === 0 && bits <= 256
  }
  if (t.startsWith('bytes')) {
    const size = parseSizeSuffix(t.slice(5))
    return size !== null && size <= 32
  }
  return false
}

/** The (`domainSeparator`, `primaryTypeHash`, `encodedData`) parts of a
 *  kind-2 request. Returns `null` for a message with field types this
 *  encoder can't reproduce (see `isStaticAtomicType`) or a missing field;
 *  the signer then signs the EIP-712 hash blind. */
export function buildErc7730Eip712Pieces(args: {
  domain: TypedDataDomain
  types: TypedDataTypes
  primaryType: string
  message: Record<string, unknown>
}): Erc7730Eip712Pieces | null {
  const fields = args.types[args.primaryType]
  if (!fields) {
    // Malformed input — `hashTypedData` would have thrown too.
    return null
  }
  for (const f of fields) {
    if (!isStaticAtomicType(f.type)) return null
  }

  // ── 1. domainSeparator ────────────────────────────────────────
  // `hashDomain` returns `0x${string}` of
  // `keccak256(EIP712Domain typehash || encode(domain))`.
  const dsepHex = hashDomain({
    domain: args.domain,
    types: args.types
  })
  const domainSeparator = hexToBytes(dsepHex)

  // ── 2. primaryTypeHash ────────────────────────────────────────
  // EIP-712 type string with no whitespace. For the static-only
  // single-struct case this is exactly `Foo(type1 name1,type2 name2,...)`.
  const typeString = `${args.primaryType}(${fields.map((f) => `${f.type} ${f.name}`).join(',')})`
  const primaryTypeHash = hexToBytes(keccak256(toBytes(typeString)))

  // ── 3. encodedData ────────────────────────────────────────────
  // viem.encodeAbiParameters([{type, name}, ...], [values...]) with values
  // in the field declaration order. Every field is a static atomic type
  // (checked above), so the ABI and EIP-712 struct encodings coincide.
  const abiParams = fields.map((f) => ({ name: f.name, type: f.type }))
  const valuesInOrder = fields.map((f) => args.message[f.name])
  // A message missing a field it declares isn't valid EIP-712.
  if (valuesInOrder.some((v) => v === undefined)) return null
  const encodedHex = encodeAbiParameters(abiParams, valuesInOrder)
  const encodedData = hexToBytes(encodedHex)

  return { domainSeparator, primaryTypeHash, encodedData }
}
