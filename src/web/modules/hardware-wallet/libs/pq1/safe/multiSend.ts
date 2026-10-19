// Safe `MultiSendCallOnly` batches, decoded with the device's exact rules.
//
// The Safe web UI wraps any flow needing more than one action in
// `SafeTx{to = MultiSendCallOnly, operation = 1 (DELEGATECALL),
// data = multiSend(transactions)}` — e.g. a CoW order placement is
// `[ERC-20 approve(GPv2VaultRelayer, amount), setPreSignature(uid, true)]`.
// The device clear-signs exactly that shape under hard rules (allowlisted
// target, canonical ABI framing, per-record operation == 0, 1..=6 records,
// at most one presign record) and refuses everything else with an
// `msend *` message on its screen. Ambire applies the same rules, so the
// bundles it attaches and the requests it refuses up front match the
// device: both sides either decode the same records or both refuse.

import { isCowPresignClaim } from '../cowswap/calldata'
import { readU32Word, readUintBe, selectorMatches } from '../transport/bytes'

/** `keccak256("multiSend(bytes)")[..4]`. */
export const MULTI_SEND_SELECTOR = new Uint8Array([0x8d, 0x80, 0xff, 0x0a])

/** The `MultiSendCallOnly` deployments the device accepts as the target of
 *  a Safe DelegateCall (from safe-global/safe-deployments; the same address
 *  on every chain). Plain `MultiSend`, whose records may DelegateCall
 *  themselves, and the zkSync variants are deliberately left out, as on the
 *  device. Ambire's general Safe support (`@ambire-common/consts/safe`)
 *  lists more contracts; this list is the device's. */
export const MULTISEND_CALL_ONLY_ADDRESSES_LC: readonly string[] = [
  '0x40a2accbd92bca938b02010e17a5b8929b49130d', // v1.3.0 canonical
  '0xa1dabef33b3b82c7814b6d82a79e50f4ac44102b', // v1.3.0 eip155
  '0x9641d764fc13c8b624c04430c7356c1c7c8102e2', // v1.4.1 canonical
  '0xa83c336b20401af773b6219ba5027174338d1836' // v1.5.0 canonical
]

/** Most records the device takes in one batch. */
export const MULTISEND_MAX_RECORDS = 6

/** Fixed per-record header: `operation(1) || to(20) || value(32) ||
 *  dataLen(32)`, followed by `data(dataLen)`. Packed — no padding
 *  between records. */
const MS_RECORD_HEADER_LEN = 1 + 20 + 32 + 32

/** Is `to` one of the `MultiSendCallOnly` deployments above? */
export function isAllowlistedMultiSendCallOnly(to: string): boolean {
  return MULTISEND_CALL_ONLY_ADDRESSES_LC.includes(to.toLowerCase())
}

/** Does this SafeTx inner call claim to be an allowlisted multiSend
 *  batch? `operation == 1` is part of the predicate on purpose: under
 *  CALL the MultiSend contract — not the Safe — is `msg.sender` for
 *  every record, so the device treats a Call to a MultiSend address as an
 *  ordinary blind-signed call. Like `isCowPresignClaim`, this does NOT
 *  check the payload's shape: a malformed batch must be refused, not
 *  degraded to blind signing. */
export function isMultiSendClaim(operation: number, to: string, data: Uint8Array): boolean {
  return (
    operation === 1 &&
    isAllowlistedMultiSendCallOnly(to) &&
    selectorMatches(data, MULTI_SEND_SELECTOR)
  )
}

/** One packed multiSend record. `data` is a subarray view of the input
 *  calldata — don't mutate. */
export interface MultiSendRecord {
  /** Raw operation byte — `summarizeMultiSend` rejects anything but 0;
   *  reported verbatim so tests can probe the rejection. */
  operation: number
  /** Lower-cased 0x-hex record target. */
  to: `0x${string}`
  /** Native value forwarded with the record's call. */
  value: bigint
  data: Uint8Array
}

/** The device's refusal messages for a batch, quoted verbatim in Ambire's
 *  logs so they match what the device screen shows. */
export type MultiSendRejectBanner =
  | 'msend malformed'
  | 'msend rec op!=0'
  | 'msend rec to=0'
  | 'msend rec count'
  | 'msend 2+ presign'

export interface MultiSendSummary {
  records: MultiSendRecord[]
  /** Indexes of records claiming a CoW `setPreSignature` (target ==
   *  GPv2Settlement, selector match). A request carries one CoW order
   *  bundle, so only 0 (generic batch) and 1 (CoW flow) are signable;
   *  >= 2 is refused by `multiSendVerdict`. */
  presignRecordIndexes: number[]
}

/** Strictly decode `multiSend(bytes)` calldata down to the packed
 *  records slice, accepting only the canonical encoding as the device
 *  does: head offset exactly 0x20, total calldata length exactly
 *  `4 + 64 + ceil32(payload)`, zero padding. Returns null on any
 *  violation — the inputs the device refuses with `msend malformed`. */
export function decodeMultiSend(data: Uint8Array): Uint8Array | null {
  if (data.length < 4 + 64) return null
  if (!selectorMatches(data, MULTI_SEND_SELECTOR)) return null
  const head = data.subarray(4)
  // Offset word: the canonical encoding of a single dynamic `bytes`
  // argument always places the tail immediately after the one-word
  // head, i.e. offset == 32.
  if (readU32Word(head, 0) !== 32) return null
  const len = readU32Word(head, 32)
  if (len === null) return null
  const payloadStart = 64
  const payloadEnd = payloadStart + len
  if (payloadEnd > head.length) return null
  // Exact-length + zero-padding: Solidity pads the bytes tail to a
  // 32-byte boundary with zeros and emits nothing after it.
  const paddedEnd = Math.ceil(payloadEnd / 32) * 32
  if (head.length !== paddedEnd) return null
  for (let i = payloadEnd; i < paddedEnd; i++) if (head[i] !== 0) return null
  return head.subarray(payloadStart, payloadEnd)
}

/** Walk the packed records slice, as the device does: the cursor must land
 *  exactly on the slice end — a partial trailing record, an out-of-range
 *  `dataLen`, or a `dataLen` with bits above u32 returns null
 *  (`msend malformed`). Record count and per-record operation are NOT
 *  validated here — that is `summarizeMultiSend`'s job, so the two
 *  refusals keep their distinct messages. */
export function walkMultiSendRecords(packed: Uint8Array): MultiSendRecord[] | null {
  const records: MultiSendRecord[] = []
  let cursor = 0
  while (cursor < packed.length) {
    const rest = packed.subarray(cursor)
    if (rest.length < MS_RECORD_HEADER_LEN) return null
    const operation = rest[0]!
    let to = '0x'
    for (let i = 1; i < 21; i++) to += rest[i]!.toString(16).padStart(2, '0')
    const value = readUintBe(rest, 21, 32)
    const dataLen = readU32Word(rest, 53)
    if (dataLen === null) return null
    const dataEnd = MS_RECORD_HEADER_LEN + dataLen
    if (dataEnd > rest.length) return null
    records.push({
      operation,
      to: to as `0x${string}`,
      value,
      data: rest.subarray(MS_RECORD_HEADER_LEN, dataEnd)
    })
    cursor += dataEnd
  }
  return records
}

const ZERO_ADDRESS_LC = '0x0000000000000000000000000000000000000000'

/** Decode + validate the payload's hard rules: strict framing, 1..=
 *  `MULTISEND_MAX_RECORDS` records, every record `operation == 0` and
 *  `to != 0x0`. Returns the device's refusal message on a violation.
 *  Presign claims are counted by selector only (the full 164-byte shape is
 *  checked when the CoW order bundle is built, so a malformed or
 *  `signed == false` presign is refused there instead of blind-signed). */
export function summarizeMultiSend(data: Uint8Array): MultiSendSummary | MultiSendRejectBanner {
  const packed = decodeMultiSend(data)
  if (packed === null) return 'msend malformed'
  const records = walkMultiSendRecords(packed)
  if (records === null) return 'msend malformed'
  // Per-record checks in the device's order — operation before the count
  // overflow — so a batch breaking several rules gets the same message on
  // both sides.
  const presignRecordIndexes: number[] = []
  for (let i = 0; i < records.length; i++) {
    const r = records[i]!
    if (r.operation !== 0) return 'msend rec op!=0'
    // MultiSendCallOnly v1.5.0 rewrites `to == 0` to the Safe itself;
    // the device refuses it for every target.
    if (r.to === ZERO_ADDRESS_LC) return 'msend rec to=0'
    if (i === MULTISEND_MAX_RECORDS) return 'msend rec count'
    if (isCowPresignClaim(r.to, r.data)) presignRecordIndexes.push(i)
  }
  if (records.length === 0) return 'msend rec count'
  return { records, presignRecordIndexes }
}

/** The device's verdict on a Safe transaction's inner call, shared by the
 *  bundle builders and the payload checks so they cannot drift. */
export type MultiSendVerdict =
  | { kind: 'not-multisend' }
  | { kind: 'accept'; summary: MultiSendSummary }
  | { kind: 'reject'; banner: MultiSendRejectBanner }

/** Whether the device accepts this Safe inner call as a multiSend batch. */
export function multiSendVerdict(
  operation: number,
  to: string,
  data: Uint8Array
): MultiSendVerdict {
  if (!isMultiSendClaim(operation, to, data)) return { kind: 'not-multisend' }
  const summary = summarizeMultiSend(data)
  if (typeof summary === 'string') return { kind: 'reject', banner: summary }
  if (summary.presignRecordIndexes.length >= 2) {
    return { kind: 'reject', banner: 'msend 2+ presign' }
  }
  return { kind: 'accept', summary }
}

/** Which calldata must a CoW order bundle bind to, for a Safe transaction
 *  reduced to its `(operation, inner_to, raw_data)`?
 *
 *    * `none`   — no CoW claim: a non-presign single call, or a
 *                 well-formed multiSend with zero presign records (a
 *                 generic batch needs no CoW order bundle). Also returned
 *                 for an `operation == 1` call that is NOT an allowlisted
 *                 multiSend claim: the device's Safe checks refuse that
 *                 first, so it never gets to the CoW check.
 *    * `bind`   — build/require the CoW order bundle against exactly these
 *                 bytes with `uid.owner == the Safe`: the full raw_data
 *                 for a direct presign, the unique presign record's 164
 *                 bytes inside a multiSend batch.
 *    * `refuse` — a claimed multiSend breaking a rule. No bundle can fix
 *                 it; the device refuses with the quoted message. */
export type SafeCowBinding =
  | { kind: 'none' }
  | { kind: 'bind'; calldata: Uint8Array }
  | { kind: 'refuse'; banner: MultiSendRejectBanner }

/** See `SafeCowBinding`. */
export function resolveSafeCowBinding(
  operation: number,
  to: string,
  rawData: Uint8Array
): SafeCowBinding {
  if (operation === 1) {
    const verdict = multiSendVerdict(operation, to, rawData)
    // Non-claim DELEGATECALL: the Safe verify refuses on-device before
    // the CoW gate — nothing for the host to bind or refuse here.
    if (verdict.kind === 'not-multisend') return { kind: 'none' }
    if (verdict.kind === 'reject') return { kind: 'refuse', banner: verdict.banner }
    const idx = verdict.summary.presignRecordIndexes[0]
    if (idx === undefined) return { kind: 'none' }
    return { kind: 'bind', calldata: verdict.summary.records[idx]!.data }
  }
  if (isCowPresignClaim(to, rawData)) return { kind: 'bind', calldata: rawData }
  return { kind: 'none' }
}

/** Why the device refuses a batch, for the logs. */
const MULTISEND_REJECT_FIX: Record<MultiSendRejectBanner, string> = {
  'msend malformed':
    'the multiSend(bytes) calldata is not the canonical Solidity encoding (offset/length/padding/record framing)',
  'msend rec op!=0':
    'a record nests a DELEGATECALL (per-record operation must be 0; MultiSendCallOnly would revert on-chain anyway)',
  'msend rec to=0':
    'a record targets the zero address (MultiSendCallOnly v1.5.0 would call the Safe itself) — address the record explicitly',
  'msend rec count': `the batch must contain 1..=${MULTISEND_MAX_RECORDS} records — split it into smaller SafeTxs`,
  'msend 2+ presign':
    'the batch contains two or more CoW setPreSignature records — one CoW order bundle can bind only one order per SafeTx'
}

/** The device's rule for a Safe transaction's operation: a DelegateCall
 *  (`operation == 1`) is signable ONLY as an allowlisted
 *  `MultiSendCallOnly` batch that passes every multiSend rule. Throws, with
 *  the device's message quoted, before the device would refuse it. */
export function assertSafeOperationSignable(
  operation: number,
  to: `0x${string}`,
  rawData: Uint8Array
): void {
  if (operation === 0) return
  if (operation !== 1) {
    throw new Error(`Safe operation=${operation} is out of range (0 = Call, 1 = DelegateCall)`)
  }
  if (!isMultiSendClaim(operation, to, rawData)) {
    throw new Error(
      'Safe DelegateCall is only supported by PQ1 firmware for a canonical MultiSendCallOnly ' +
        `batch — target ${to} with this calldata would be refused on-device.`
    )
  }
  const verdict = multiSendVerdict(operation, to, rawData)
  if (verdict.kind === 'reject') {
    throw new Error(
      `Safe multiSend batch refused by PQ1 firmware ("Safe sign / ${verdict.banner}"): ` +
        `${MULTISEND_REJECT_FIX[verdict.banner]}.`
    )
  }
}
