// SIGN_OFFCHAIN: signing a message, typed data or a hash. Builds the
// payload for each kind and parses the device's reply.

import {
  C10_SIG_LEN,
  COW_ORDER_BUNDLE_MAX_LEN,
  COW_ORDER_CANONICAL_LEN,
  ERC20_BUNDLE_MAX_LEN,
  ERC6492_WRAPPED_BLOB_LEN,
  ERC7730_BUNDLE_MAX_LEN,
  isAccountIndex,
  isSlotIndex,
  MAX_NAME_BUNDLES,
  MAX_OFFCHAIN_COW_ORDER_LEN,
  MAX_OFFCHAIN_EIP712_ENCODED_DATA_LEN,
  MAX_OFFCHAIN_EIP712_TYPED_LEN,
  MAX_OFFCHAIN_PERMIT2_LEN,
  MAX_OFFCHAIN_PERSONAL_SIGN_LEN,
  MAX_OFFCHAIN_SAFE_TX_LEN,
  NAME_BUNDLE_MAX_LEN,
  OFFCHAIN_FLAG_ACCOUNT_DEPLOYED,
  OFFCHAIN_KIND_COW_ORDER,
  OFFCHAIN_KIND_EIP712_TYPED,
  OFFCHAIN_KIND_PERMIT2,
  OFFCHAIN_KIND_PERSONAL_SIGN,
  OFFCHAIN_KIND_RAW32,
  OFFCHAIN_KIND_SAFE_TX,
  PERMIT2_MAX_NAME_BUNDLES,
  SAFE_TX_BUNDLE_MAX_LEN,
  SAFE_TX_CANONICAL_LEN,
  SIGN_OFFCHAIN_HEADER_LEN,
  SIGN_OFFCHAIN_INPUT_MAX_LEN,
  SIGN_OFFCHAIN_OUTPUT_LEN,
  SIGN_OFFCHAIN_OUTPUT_LEN_COUNTERFACTUAL
} from '../config'
import { readPermit2Framing } from '../permit2/canonical'
import { concatBytes, readU16Be, readU64Be, u16be, u32be, u64be } from './bytes'

type SignOffchainCommon = {
  accountIndex: number
  chainId: bigint | number
  slotIndex: number
  /** Whether the PQSmartWallet is deployed on the target chain (Ambire
   *  checks `eth_getCode` right before signing).
   *
   *  - `true`  → device emits 4016 B = `[count(8)][C10 sig(4008)]`. Host
   *              wraps as `abi.encode(uint256 ownerIndex, bytes sig)`.
   *  - `false` → device emits 8616 B = `[count(8)][ERC-6492 blob(8608)]`
   *              that already encodes the factory deploy + sig wrapper +
   *              0x6492…6492 magic. Pass-through to the dapp.
   *
   *  Firmware constraint when `accountDeployed=false`: `slotIndex` MUST
   *  be 0 (the factory only seeds bootstrap + slot 0). */
  accountDeployed: boolean
}

/** What to sign, by kind. */
export type SignOffchainParams =
  | (SignOffchainCommon & {
      /** A personal_sign message; the device shows it, then signs its
       *  EIP-191 hash. */
      kind: 'personal_sign'
      message: Uint8Array
    })
  | (SignOffchainCommon & {
      /** A 32-byte hash, signed blind: the device shows only the hash, under
       *  a loud warning. */
      kind: 'raw32'
      digest: Uint8Array
    })
  | (SignOffchainCommon & {
      /** EIP-712 typed data with an ERC-7730 descriptor.
       *
       *  The device verifies the descriptor bundle, binds it to the domain
       *  separator and primary type hash, shows the fields the descriptor
       *  names, then signs the EIP-712 hash
       *  `keccak256(0x1901 || domain_separator || keccak256(primary_type_hash || encoded_data))`.
       *
       *  A descriptor the device can't verify or bind is a refusal, and a
       *  refused request is never sent again as a blind hash. Typed data
       *  with no on-device route at all (no descriptor, not a Safe
       *  transaction, CoW order or Permit2 permit) is signed as `raw32` over
       *  its EIP-712 hash, intentionally: the device then shows a loud BLIND
       *  HASH page. */
      kind: 'eip712_typed'
      /** 32-byte `keccak256(EIP712Domain_typehash || encode(domain))`. */
      domainSeparator: Uint8Array
      /** 32-byte `keccak256(typeString)` of the primary type. */
      primaryTypeHash: Uint8Array
      /** `viem::encodeAbiParameters(types[primaryType], message)` — the
       *  ABI-encoded struct body WITHOUT a typehash prefix. The firmware
       *  prepends the typehash internally before hashing. */
      encodedData: Uint8Array
      /** The descriptor bundle from `erc7730/catalog.ts`:
       *  `ir_len(u16 BE) || ir || leaf_index(u32 BE) || proof_depth(u32 BE) || proof`. */
      erc7730Bundle: Uint8Array
    })
  | (SignOffchainCommon & {
      /** An EIP-712 SafeTx (kind 4). The device recomputes `safeTxHash`
       *  from `safeV1Bundle`, shows the Safe transaction and signs exactly
       *  what a raw32 sign of that hash would. Deployed wallets only. */
      kind: 'safe_tx'
      /** `canonical (281) || u16 raw_len || raw_data` (`packSafeV1Bundle`). */
      safeV1Bundle: Uint8Array
      /** ERC-20 bundle for the SafeTx's token (inner `to`, or a multiSend
       *  record); omit when there is none. */
      erc20Bundle?: Uint8Array
      /** CoW order bundle — required exactly when the SafeTx pre-signs a
       *  CoW order (owner = the Safe), absent otherwise. */
      cowOrderBundle?: Uint8Array
      /** Name bundles for the addresses shown (≤ 4). */
      nameBundles?: Uint8Array[]
    })
  | (SignOffchainCommon & {
      /** A CoW Protocol GPv2Order (kind 5). The device recomputes the order
       *  digest from `cowOrderBundle`, shows the order and signs exactly what a
       *  raw32 sign of that digest would. Deployed wallets only. */
      kind: 'cow_order'
      /** `canonical (204) || u16 sell_len || sell || u16 buy_len || buy`
       *  (`packCowOrderBundle`). */
      cowOrderBundle: Uint8Array
    })
  | (SignOffchainCommon & {
      /** A Uniswap Permit2 permit (kind 6). The device recomputes the permit
       *  digest from `permit2Canonical`, shows the permit and signs exactly
       *  what a raw32 sign of that digest would. Deployed wallets only. */
      kind: 'permit2'
      /** The canonical permit (`encodePermit2Canonical`). */
      permit2Canonical: Uint8Array
      /** One ERC-20 bundle per token, in the permit's token order;
       *  `undefined` for a token without one. */
      erc20Bundles: (Uint8Array | undefined)[]
      /** The spender's name bundle, if it has one. */
      nameBundles?: Uint8Array[]
    })

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** What to sign, without the account, chain, slot and deploy fields every
 *  kind shares. */
export type SignOffchainRequest = DistributiveOmit<SignOffchainParams, keyof SignOffchainCommon>

const lenPrefixed = (bytes: Uint8Array): Uint8Array[] => [u16be(bytes.length), bytes]

/** At most `max` name bundles, none empty or longer than the device takes. */
function assertNameBundles(names: Uint8Array[], max: number): void {
  if (names.length > max) {
    throw new Error(`signOffchain: ${names.length} name bundles > ${max}`)
  }
  for (const n of names) {
    if (n.length === 0 || n.length > NAME_BUNDLE_MAX_LEN) {
      throw new Error(`signOffchain: name bundle is ${n.length} bytes`)
    }
  }
}

/** Kind-4 payload:
 *  `[u16][safe_v1] [u16][erc20] [u16][cow] [u8 n]{[u16][name]}×n`. */
function buildSafeTxOffchainPayload(p: {
  safeV1Bundle: Uint8Array
  erc20Bundle?: Uint8Array
  cowOrderBundle?: Uint8Array
  nameBundles?: Uint8Array[]
}): Uint8Array {
  const erc20 = p.erc20Bundle ?? new Uint8Array(0)
  const cow = p.cowOrderBundle ?? new Uint8Array(0)
  const names = p.nameBundles ?? []
  if (
    p.safeV1Bundle.length < SAFE_TX_CANONICAL_LEN + 2 ||
    p.safeV1Bundle.length > SAFE_TX_BUNDLE_MAX_LEN
  ) {
    throw new Error(`signOffchain: safe_v1 section is ${p.safeV1Bundle.length} bytes`)
  }
  const rawLen = readU16Be(p.safeV1Bundle, SAFE_TX_CANONICAL_LEN)
  if (SAFE_TX_CANONICAL_LEN + 2 + rawLen !== p.safeV1Bundle.length) {
    throw new Error('signOffchain: safe_v1 raw_len does not end the section')
  }
  if (erc20.length > ERC20_BUNDLE_MAX_LEN) {
    throw new Error(`signOffchain: erc20 bundle ${erc20.length} > ${ERC20_BUNDLE_MAX_LEN}`)
  }
  if (
    cow.length > COW_ORDER_BUNDLE_MAX_LEN ||
    (cow.length > 0 && cow.length < COW_ORDER_CANONICAL_LEN)
  ) {
    throw new Error(`signOffchain: CoW section is ${cow.length} bytes`)
  }
  assertNameBundles(names, MAX_NAME_BUNDLES)
  const out = concatBytes([
    ...lenPrefixed(p.safeV1Bundle),
    ...lenPrefixed(erc20),
    ...lenPrefixed(cow),
    new Uint8Array([names.length]),
    ...names.flatMap(lenPrefixed)
  ])
  if (out.length > MAX_OFFCHAIN_SAFE_TX_LEN) {
    throw new Error(`signOffchain: safe_tx payload ${out.length} > ${MAX_OFFCHAIN_SAFE_TX_LEN}`)
  }
  return out
}

/** Kind-5 payload: the CoW order bundle itself, which must be framed
 *  exactly (canonical order, then two length-prefixed legs, nothing after). */
function buildCowOrderOffchainPayload(cowOrderBundle: Uint8Array): Uint8Array {
  if (
    cowOrderBundle.length < COW_ORDER_CANONICAL_LEN + 4 ||
    cowOrderBundle.length > MAX_OFFCHAIN_COW_ORDER_LEN
  ) {
    throw new Error(`signOffchain: cow_order payload is ${cowOrderBundle.length} bytes`)
  }
  const sellLen = readU16Be(cowOrderBundle, COW_ORDER_CANONICAL_LEN)
  const buyOff = COW_ORDER_CANONICAL_LEN + 2 + sellLen
  if (buyOff + 2 > cowOrderBundle.length) {
    throw new Error('signOffchain: cow_order sell leg overruns the payload')
  }
  const buyLen = readU16Be(cowOrderBundle, buyOff)
  if (buyOff + 2 + buyLen !== cowOrderBundle.length) {
    throw new Error('signOffchain: cow_order legs do not end the payload')
  }
  return cowOrderBundle
}

/** Kind-6 payload: `[canonical permit] {[u16][erc20]}×count [u8 n]{[u16][name]}×n`,
 *  one ERC-20 slot per token (length 0: none) and at most the spender's
 *  name. */
function buildPermit2OffchainPayload(p: {
  permit2Canonical: Uint8Array
  erc20Bundles: (Uint8Array | undefined)[]
  nameBundles?: Uint8Array[]
}): Uint8Array {
  const { count } = readPermit2Framing(p.permit2Canonical)
  if (p.erc20Bundles.length !== count) {
    throw new Error(`signOffchain: ${p.erc20Bundles.length} ERC-20 slots for ${count} tokens`)
  }
  const erc20Slots = p.erc20Bundles.map((bundle) => bundle ?? new Uint8Array(0))
  for (const bundle of erc20Slots) {
    if (bundle.length > ERC20_BUNDLE_MAX_LEN) {
      throw new Error(`signOffchain: erc20 bundle ${bundle.length} > ${ERC20_BUNDLE_MAX_LEN}`)
    }
  }
  const names = p.nameBundles ?? []
  assertNameBundles(names, PERMIT2_MAX_NAME_BUNDLES)
  const out = concatBytes([
    p.permit2Canonical,
    ...erc20Slots.flatMap(lenPrefixed),
    new Uint8Array([names.length]),
    ...names.flatMap(lenPrefixed)
  ])
  if (out.length > MAX_OFFCHAIN_PERMIT2_LEN) {
    throw new Error(`signOffchain: permit2 payload ${out.length} > ${MAX_OFFCHAIN_PERMIT2_LEN}`)
  }
  return out
}

/** Kind-2 payload: `[u16 1] [domain separator] [primary type hash]
 *  [u16 len][struct body] [u16 len][ERC-7730 bundle]`. The leading 1 says a
 *  domain separator is present; the device refuses kind 2 without one. */
function buildEip712TypedPayload(p: {
  domainSeparator: Uint8Array
  primaryTypeHash: Uint8Array
  encodedData: Uint8Array
  erc7730Bundle: Uint8Array
}): Uint8Array {
  if (p.domainSeparator.length !== 32) {
    throw new Error(
      `signOffchain: eip712 domainSeparator must be 32 bytes, got ${p.domainSeparator.length}`
    )
  }
  if (p.primaryTypeHash.length !== 32) {
    throw new Error(
      `signOffchain: eip712 primaryTypeHash must be 32 bytes, got ${p.primaryTypeHash.length}`
    )
  }
  if (p.encodedData.length > MAX_OFFCHAIN_EIP712_ENCODED_DATA_LEN) {
    throw new Error(
      `signOffchain: eip712 encodedData ${p.encodedData.length} > ${MAX_OFFCHAIN_EIP712_ENCODED_DATA_LEN}`
    )
  }
  // The device has no blind fallback for kind 2: typed data without a
  // descriptor goes out as raw32 instead (see `SignOffchainParams`).
  if (p.erc7730Bundle.length === 0) {
    throw new Error('signOffchain: eip712_typed requires a non-empty erc7730Bundle')
  }
  if (p.erc7730Bundle.length > ERC7730_BUNDLE_MAX_LEN) {
    throw new Error(
      `signOffchain: erc7730Bundle ${p.erc7730Bundle.length} > ${ERC7730_BUNDLE_MAX_LEN}`
    )
  }
  const payload = concatBytes([
    u16be(1),
    p.domainSeparator,
    p.primaryTypeHash,
    ...lenPrefixed(p.encodedData),
    ...lenPrefixed(p.erc7730Bundle)
  ])
  if (payload.length > MAX_OFFCHAIN_EIP712_TYPED_LEN) {
    throw new Error(
      `signOffchain: eip712_typed payload ${payload.length} > ${MAX_OFFCHAIN_EIP712_TYPED_LEN}`
    )
  }
  return payload
}

/** The kind byte and payload of a request. */
function kindAndPayload(p: SignOffchainParams): [number, Uint8Array] {
  switch (p.kind) {
    case 'personal_sign':
      if (p.message.length > MAX_OFFCHAIN_PERSONAL_SIGN_LEN) {
        throw new Error(
          `signOffchain: personal_sign message ${p.message.length} > ${MAX_OFFCHAIN_PERSONAL_SIGN_LEN} bytes`
        )
      }
      return [OFFCHAIN_KIND_PERSONAL_SIGN, p.message]
    case 'raw32':
      if (p.digest.length !== 32) {
        throw new Error(`signOffchain: raw32 digest must be 32 bytes, got ${p.digest.length}`)
      }
      return [OFFCHAIN_KIND_RAW32, p.digest]
    case 'eip712_typed':
      return [OFFCHAIN_KIND_EIP712_TYPED, buildEip712TypedPayload(p)]
    case 'safe_tx':
      return [OFFCHAIN_KIND_SAFE_TX, buildSafeTxOffchainPayload(p)]
    case 'cow_order':
      return [OFFCHAIN_KIND_COW_ORDER, buildCowOrderOffchainPayload(p.cowOrderBundle)]
    case 'permit2':
      return [OFFCHAIN_KIND_PERMIT2, buildPermit2OffchainPayload(p)]
  }
}

/** The SIGN_OFFCHAIN input: the 17-byte header (see
 *  `SIGN_OFFCHAIN_HEADER_LEN`), then the kind's payload. */
export function buildSignOffchainPayload(p: SignOffchainParams): Uint8Array {
  if (!isAccountIndex(p.accountIndex)) {
    throw new Error(`signOffchain: account_index out of range: ${p.accountIndex}`)
  }
  if (!isSlotIndex(p.slotIndex)) {
    throw new Error(`signOffchain: slot_index out of range: ${p.slotIndex}`)
  }
  if (!p.accountDeployed && p.slotIndex !== 0) {
    throw new Error(`signOffchain: counterfactual path requires slot_index=0, got ${p.slotIndex}`)
  }
  if (
    (p.kind === 'safe_tx' || p.kind === 'cow_order' || p.kind === 'permit2') &&
    !p.accountDeployed
  ) {
    // None of a Safe, GPv2Settlement and Permit2 unwraps an ERC-6492
    // signature (Permit2 checks a signer without code with ecrecover), and
    // the device refuses these kinds for an undeployed wallet.
    throw new Error(`signOffchain: ${p.kind} needs a deployed wallet`)
  }

  const [kindByte, payload] = kindAndPayload(p)
  const out = concatBytes([
    new Uint8Array([p.accountIndex]),
    u64be(p.chainId),
    u32be(p.slotIndex),
    new Uint8Array([kindByte]),
    u16be(payload.length),
    new Uint8Array([p.accountDeployed ? OFFCHAIN_FLAG_ACCOUNT_DEPLOYED : 0x00]),
    payload
  ])
  if (out.length !== SIGN_OFFCHAIN_HEADER_LEN + payload.length) {
    throw new Error(`signOffchain: header invariant broken (${out.length} bytes)`)
  }
  if (out.length > SIGN_OFFCHAIN_INPUT_MAX_LEN) {
    throw new Error(
      `signOffchain: payload too large (${out.length} > ${SIGN_OFFCHAIN_INPUT_MAX_LEN})`
    )
  }
  return out
}

/** The device's reply to SIGN_OFFCHAIN. */
export type SignOffchainBundle =
  | {
      kind: 'deployed'
      newOffchainCount: bigint
      /** 4008-byte raw SPHINCS+C10 signature. Pass through
       *  `abi.encode(uint256 ownerIndex, bytes signature)` to produce the
       *  ERC-1271 sig the verifier consumes. */
      innerSig: Uint8Array
    }
  | {
      kind: 'counterfactual'
      newOffchainCount: bigint
      /** 8608-byte ERC-6492-wrapped signature emitted by the firmware —
       *  `abi.encode(address factory, bytes factoryCalldata, bytes sigWrapper)`
       *  followed by the 32-byte 0x6492…6492 magic suffix. Pass-through
       *  to the dapp; any EIP-6492-aware verifier will deploy-and-verify
       *  the wallet in a single `eth_call`. */
      erc6492Sig: Uint8Array
    }

/** Parse a SIGN_OFFCHAIN reply: the off-chain count (u64 BE), then a raw
 *  signature (deployed wallet) or an ERC-6492 signature (undeployed). */
export function parseSignOffchainResponse(resp: Uint8Array): SignOffchainBundle {
  if (
    resp.length !== SIGN_OFFCHAIN_OUTPUT_LEN &&
    resp.length !== SIGN_OFFCHAIN_OUTPUT_LEN_COUNTERFACTUAL
  ) {
    throw new Error(
      `signOffchain: response length ${resp.length} is neither ${SIGN_OFFCHAIN_OUTPUT_LEN} (deployed) nor ${SIGN_OFFCHAIN_OUTPUT_LEN_COUNTERFACTUAL} (counterfactual)`
    )
  }
  const newOffchainCount = readU64Be(resp, 0)
  if (resp.length === SIGN_OFFCHAIN_OUTPUT_LEN) {
    return { kind: 'deployed', newOffchainCount, innerSig: resp.slice(8, 8 + C10_SIG_LEN) }
  }
  return {
    kind: 'counterfactual',
    newOffchainCount,
    erc6492Sig: resp.slice(8, 8 + ERC6492_WRAPPED_BLOB_LEN)
  }
}
