// SIGN_USEROP and SIGN_USEROP_BATCH payloads: the UserOp fields the device
// shows and signs, each call, and the clear-signing bundles attached to each
// call (see `aa/callTrailers.ts` for how they are chosen).

import {
  ACCOUNT_INDEX_SHIFT,
  COW_ORDER_BUNDLE_MAX_LEN,
  ENTRY_POINT_V06,
  ERC20_BUNDLE_MAX_LEN,
  ERC7730_BUNDLE_MAX_LEN,
  FLAG_INCLUDE_INIT_CODE,
  isAccountIndex,
  isSlotIndex,
  MAX_BATCH_CALL_DATA_TOTAL_LEN,
  MAX_BATCH_TXS,
  MAX_NAME_BUNDLES,
  MAX_TRAILERS_PER_BATCH,
  MAX_TX_LEN_LEGACY,
  NAME_BUNDLE_MAX_LEN,
  SAFE_TX_BUNDLE_MAX_LEN,
  SAFE_TX_CANONICAL_LEN,
  SELECTOR_BUNDLE_MAX_LEN,
  SHA256_EMPTY,
  SIGN_USEROP_BATCH_WIRE_VERSION,
  TRAILER_KIND_COW_ORDER,
  TRAILER_KIND_ERC20,
  TRAILER_KIND_ERC7730,
  TRAILER_KIND_NAME,
  TRAILER_KIND_SAFE_V1,
  TRAILER_KIND_SEL_CURATED,
  TRAILER_TX_IDX_BATCH_WIDE,
  TRAILERS_TOTAL_MAX_LEN
} from '../config'
import { isApproveHashClaim } from '../safe/calldata'
import { SAFE_TX_OPERATION_OFFSET, SAFE_TX_TO_OFFSET } from '../safe/canonical'
import { decodeExecTransaction } from '../safe/execCalldata'
import { isCowPresignClaim } from '../cowswap/calldata'
import { resolveSafeCowBinding, type SafeCowBinding } from '../safe/multiSend'
import {
  addressBytes,
  bytesToHex0x,
  concatBytes,
  readU16Be,
  u16be,
  u256be,
  u32be,
  u64be
} from './bytes'

/** The clear-signing bundles one call can carry. Each is verified by the
 *  device. Without one, the device shows less, or refuses a call it knows
 *  needs it (`assertCallBundles` checks the cases Ambire can tell first). */
export type CallBundles = {
  /** ERC-20 metadata for the token the call moves (`erc20/db.ts`). */
  erc20Bundle?: Uint8Array
  /** The CoW order a `setPreSignature` signs (`cowswap/orderBundle.ts`). */
  cowOrderBundle?: Uint8Array
  /** The Safe transaction behind an `approveHash` (`safe/safeV1Trailer.ts`):
   *  `canonical(281) || raw_data_len(u16 BE) || raw_data`. */
  safeV1Bundle?: Uint8Array
  /** The function name of a call the device would otherwise blind-sign
   *  (`selectors/db.ts`). */
  selectorBundle?: Uint8Array
  /** An ERC-7730 descriptor for the call's contract (`erc7730/catalog.ts`):
   *  `ir_len(u16 BE) || ir || leaf_index(u32 BE) || proof_depth(u32 BE) || proof`. */
  erc7730Bundle?: Uint8Array
}

/** The UserOp fields both commands start with. */
type UserOpHeader = {
  chainId: bigint | number
  /** The account number on the device (0-255). */
  accountIndex: number
  /** The wallet's active owner slot. */
  slotIndex: number
  /** Ask the device for the wallet's init code: the UserOp deploys the
   *  wallet. Only slot 0 exists before deployment. */
  includeInitCode?: boolean
  sender: `0x${string}`
  nonce: bigint | number | string
  callGas: bigint | number | string
  verGas: bigint | number | string
  preVerificationGas: bigint | number | string
  maxFeePerGas: bigint | number | string
  maxPriorityFeePerGas: bigint | number | string
}

/** One call of a batch, with its bundles. */
export type BatchInnerCall = CallBundles & {
  to: `0x${string}`
  value: bigint | number | string
  data?: Uint8Array
}

/** A single-call UserOp for SIGN_USEROP. */
export type SignRequestParams = UserOpHeader &
  BatchInnerCall & {
    /** Address-name bundles for the addresses the device shows (`names/db.ts`),
     *  at most `MAX_NAME_BUNDLES`. Without them it shows the raw address. */
    nameBundles?: Uint8Array[]
  }

/** A UserOp of up to `MAX_BATCH_TXS` calls for SIGN_USEROP_BATCH. */
export type BatchSignRequestParams = UserOpHeader & {
  calls: BatchInnerCall[]
  /** Address-name bundles shared by every call, at most `MAX_NAME_BUNDLES`. */
  nameBundles?: Uint8Array[]
}

/** The largest bundle of each trailer kind Ambire sends (see `config.ts`). */
const TRAILER_KIND_MAX_LEN: Record<number, number> = {
  [TRAILER_KIND_ERC20]: ERC20_BUNDLE_MAX_LEN,
  [TRAILER_KIND_COW_ORDER]: COW_ORDER_BUNDLE_MAX_LEN,
  [TRAILER_KIND_SAFE_V1]: SAFE_TX_BUNDLE_MAX_LEN,
  [TRAILER_KIND_SEL_CURATED]: SELECTOR_BUNDLE_MAX_LEN,
  [TRAILER_KIND_ERC7730]: ERC7730_BUNDLE_MAX_LEN,
  [TRAILER_KIND_NAME]: NAME_BUNDLE_MAX_LEN
}

const EMPTY = new Uint8Array(0)

const hasBytes = (bytes?: Uint8Array): bytes is Uint8Array => !!bytes && bytes.length > 0

function assertBundleFits(kind: number, bytes: Uint8Array, where: string): void {
  const cap = TRAILER_KIND_MAX_LEN[kind]!
  if (bytes.length > cap) {
    throw new Error(`${where}trailer kind ${kind} is ${bytes.length} B, over the cap of ${cap} B`)
  }
}

/** Resolve the CoW-binding obligation of a Safe flow: does this
 *  (inner_data, safe_v1 bundle) pair describe a SafeTx whose inner call
 *  claims a CoW `setPreSignature` — directly, or as the unique presign
 *  record inside an allowlisted MultiSendCallOnly batch? Same precedence as
 *  the firmware: the approveHash context out of the safe_v1 bundle first,
 *  then the execTransaction context out of the call data, so the host
 *  check and the device's cannot disagree. An `operation == 1` context that
 *  is NOT an allowlisted multiSend claim resolves to `none`: the device's
 *  Safe check refuses it first. A claimed multiSend that breaks a rule
 *  resolves to `refuse`; the device rejects it whatever is attached. */
function safeWrappedCowBinding(data: Uint8Array, safeV1Bundle: Uint8Array): SafeCowBinding {
  if (safeV1Bundle.length >= SAFE_TX_CANONICAL_LEN + 2) {
    const rawLen = readU16Be(safeV1Bundle, SAFE_TX_CANONICAL_LEN)
    const rawStart = SAFE_TX_CANONICAL_LEN + 2
    if (rawStart + rawLen <= safeV1Bundle.length) {
      const innerTo = bytesToHex0x(safeV1Bundle.subarray(SAFE_TX_TO_OFFSET, SAFE_TX_TO_OFFSET + 20))
      const binding = resolveSafeCowBinding(
        safeV1Bundle[SAFE_TX_OPERATION_OFFSET]!,
        innerTo,
        safeV1Bundle.subarray(rawStart, rawStart + rawLen)
      )
      if (binding.kind !== 'none') return binding
    }
  }
  const exec = decodeExecTransaction(data)
  if (exec !== null) {
    const binding = resolveSafeCowBinding(exec.operation, exec.to, exec.data)
    if (binding.kind !== 'none') return binding
  }
  return { kind: 'none' }
}

/** Refuse, before the device does, a call it won't sign because a bundle is
 *  missing: an `approveHash` on a Safe needs the Safe transaction bundle,
 *  and a CoW `setPreSignature` (direct, or inside a Safe transaction or a
 *  Safe multiSend batch) needs the CoW order bundle. A Safe multiSend batch
 *  that breaks the device's rules is refused whatever is attached. These
 *  checks stop a host from downgrading such calls to blind signing. */
function assertCallBundles(call: BatchInnerCall, data: Uint8Array, where: string): void {
  if (isApproveHashClaim(data) && !hasBytes(call.safeV1Bundle)) {
    throw new Error(`${where}Safe approveHash requires a safeV1Bundle`)
  }
  const hasCowOrder = hasBytes(call.cowOrderBundle)
  if (isCowPresignClaim(call.to.toLowerCase(), data) && !hasCowOrder) {
    throw new Error(`${where}CoW setPreSignature requires a CoW order bundle`)
  }
  const wrapped = safeWrappedCowBinding(data, call.safeV1Bundle ?? EMPTY)
  if (wrapped.kind === 'refuse') {
    throw new Error(
      `${where}Safe multiSend batch refused by the PQ1 ("Safe sign / ${wrapped.banner}"); no bundle can fix it`
    )
  }
  if (wrapped.kind === 'bind' && !hasCowOrder) {
    throw new Error(
      `${where}Safe-wrapped CoW setPreSignature requires a CoW order bundle for the same call, with the Safe as the order owner`
    )
  }
}

/** `chainId .. paymasterAndDataHash`: the first 276 bytes, the same for
 *  both commands. */
function buildUserOpHeader(p: UserOpHeader): Uint8Array {
  if (!isAccountIndex(p.accountIndex)) {
    throw new Error(`accountIndex out of range: ${p.accountIndex}`)
  }
  if (!isSlotIndex(p.slotIndex)) {
    throw new Error(`slotIndex out of range: ${p.slotIndex}`)
  }
  if (p.includeInitCode && p.slotIndex !== 0) {
    throw new Error('includeInitCode requires slotIndex = 0')
  }
  const flags =
    (p.includeInitCode ? FLAG_INCLUDE_INIT_CODE : 0) |
    (p.accountIndex << ACCOUNT_INDEX_SHIFT) |
    p.slotIndex

  return concatBytes([
    u64be(p.chainId),
    u32be(flags),
    addressBytes(p.sender),
    addressBytes(ENTRY_POINT_V06),
    u256be(p.nonce),
    u256be(p.callGas),
    u256be(p.verGas),
    u256be(p.preVerificationGas),
    u256be(p.maxFeePerGas),
    u256be(p.maxPriorityFeePerGas),
    SHA256_EMPTY
  ])
}

/** `to(20) || value(u256) || data_len(u16) || data` of one call, after
 *  checking the data length against `maxDataLen` (the device's per-call cap,
 *  see `maxCallDataLen`) and the call's bundles. */
function encodeCall(call: BatchInnerCall, where: string, maxDataLen: number): Uint8Array {
  const data = call.data ?? EMPTY
  if (data.length > maxDataLen) {
    throw new Error(`${where}call data too long (${data.length} > ${maxDataLen})`)
  }
  assertCallBundles(call, data, where)
  return concatBytes([addressBytes(call.to), u256be(call.value), u16be(data.length), data])
}

function assertNameBundles(nameBundles: Uint8Array[]): void {
  if (nameBundles.length > MAX_NAME_BUNDLES) {
    throw new Error(`${nameBundles.length} name bundles, over the cap of ${MAX_NAME_BUNDLES}`)
  }
  nameBundles.forEach((bundle) => assertBundleFits(TRAILER_KIND_NAME, bundle, ''))
}

/**
 * The SIGN_USEROP payload: the header, the call, then its bundles as
 * positional, u16-length-prefixed slots in the order erc20, reserved,
 * CoW order, safe_v1, selector, self-attested selector (never sent),
 * erc7730. A slot before a present one is sent as length 0; trailing empty
 * slots are left out. Name bundles
 * come after all seven slots, as `[u8 count]` and u16-length-prefixed
 * bundles; without names that section is left out entirely, which the
 * device treats differently from a count of 0.
 *
 * `maxDataLen` is the device's per-call cap (`maxCallDataLen` of its
 * capabilities); it defaults to the cap every firmware accepts.
 */
export function buildSignPayload(
  p: SignRequestParams,
  maxDataLen: number = MAX_TX_LEN_LEGACY
): Uint8Array {
  const header = buildUserOpHeader(p)
  const call = encodeCall(p, '', maxDataLen)
  const slots: Array<[number | null, Uint8Array]> = [
    [TRAILER_KIND_ERC20, p.erc20Bundle ?? EMPTY],
    [null, EMPTY], // kind 2, reserved by the firmware
    [TRAILER_KIND_COW_ORDER, p.cowOrderBundle ?? EMPTY],
    [TRAILER_KIND_SAFE_V1, p.safeV1Bundle ?? EMPTY],
    [TRAILER_KIND_SEL_CURATED, p.selectorBundle ?? EMPTY],
    [null, EMPTY], // kind 6, a function name without a catalog proof
    [TRAILER_KIND_ERC7730, p.erc7730Bundle ?? EMPTY]
  ]
  slots.forEach(([kind, bytes]) => {
    if (kind !== null) assertBundleFits(kind, bytes, '')
  })
  const nameBundles = p.nameBundles ?? []
  assertNameBundles(nameBundles)

  let slotsToSend = nameBundles.length > 0 ? slots.length : 0
  slots.forEach(([, bytes], i) => {
    if (bytes.length > 0) slotsToSend = Math.max(slotsToSend, i + 1)
  })
  const out: Uint8Array[] = [header, call]
  slots.slice(0, slotsToSend).forEach(([, bytes]) => out.push(u16be(bytes.length), bytes))
  if (nameBundles.length > 0) {
    out.push(new Uint8Array([nameBundles.length]))
    nameBundles.forEach((bundle) => out.push(u16be(bundle.length), bundle))
  }
  return concatBytes(out)
}

type TrailerRecord = { kind: number; txIdx: number; bytes: Uint8Array }

/** The trailer records of one call: its present bundles, in kind order. */
function callTrailerRecords(call: BatchInnerCall, txIdx: number): TrailerRecord[] {
  const where = `inner call ${txIdx}: `
  const bundles: Array<[number, Uint8Array | undefined]> = [
    [TRAILER_KIND_ERC20, call.erc20Bundle],
    [TRAILER_KIND_COW_ORDER, call.cowOrderBundle],
    [TRAILER_KIND_SAFE_V1, call.safeV1Bundle],
    [TRAILER_KIND_SEL_CURATED, call.selectorBundle],
    [TRAILER_KIND_ERC7730, call.erc7730Bundle]
  ]
  return bundles.flatMap(([kind, bytes]) => {
    if (!hasBytes(bytes)) return []
    assertBundleFits(kind, bytes, where)
    return [{ kind, txIdx, bytes }]
  })
}

/**
 * The SIGN_USEROP_BATCH payload: the header, the layout version byte, the
 * call count and each call, then the bundles as a tagged trailer list
 * `[u8 count]` + `count × {u8 kind, u8 tx_idx, u16 BE len, bytes}`. Name
 * bundles apply to every call (`tx_idx` 0xff). The device refuses anything
 * after the last record.
 *
 * `maxDataLen` is the device's per-call cap, as for `buildSignPayload`; the
 * calls' summed data is capped at `MAX_BATCH_CALL_DATA_TOTAL_LEN` on every
 * firmware.
 */
export function buildSignBatchPayload(
  p: BatchSignRequestParams,
  maxDataLen: number = MAX_TX_LEN_LEGACY
): Uint8Array {
  if (p.calls.length === 0) throw new Error('SIGN_USEROP_BATCH: calls[] must be non-empty')
  if (p.calls.length > MAX_BATCH_TXS) {
    throw new Error(`SIGN_USEROP_BATCH: too many calls (${p.calls.length} > ${MAX_BATCH_TXS})`)
  }
  const totalDataBytes = p.calls.reduce((sum, call) => sum + (call.data?.length ?? 0), 0)
  if (totalDataBytes > MAX_BATCH_CALL_DATA_TOTAL_LEN) {
    throw new Error(
      `SIGN_USEROP_BATCH: call data too long in total (${totalDataBytes} > ${MAX_BATCH_CALL_DATA_TOTAL_LEN})`
    )
  }
  const nameBundles = p.nameBundles ?? []
  assertNameBundles(nameBundles)

  const calls = p.calls.map((call, txIdx) => encodeCall(call, `inner call ${txIdx}: `, maxDataLen))
  const records: TrailerRecord[] = [
    ...p.calls.flatMap((call, txIdx) => callTrailerRecords(call, txIdx)),
    ...nameBundles.map((bytes) => ({
      kind: TRAILER_KIND_NAME,
      txIdx: TRAILER_TX_IDX_BATCH_WIDE,
      bytes
    }))
  ]
  if (records.length > MAX_TRAILERS_PER_BATCH) {
    throw new Error(`${records.length} trailers, over the cap of ${MAX_TRAILERS_PER_BATCH}`)
  }
  const totalTrailerBytes = records.reduce((sum, r) => sum + r.bytes.length, 0)
  if (totalTrailerBytes > TRAILERS_TOTAL_MAX_LEN) {
    throw new Error(`${totalTrailerBytes} trailer bytes, over the cap of ${TRAILERS_TOTAL_MAX_LEN}`)
  }

  return concatBytes([
    buildUserOpHeader(p),
    new Uint8Array([SIGN_USEROP_BATCH_WIRE_VERSION, p.calls.length]),
    ...calls,
    new Uint8Array([records.length]),
    ...records.flatMap((r) => [new Uint8Array([r.kind, r.txIdx]), u16be(r.bytes.length), r.bytes])
  ])
}
