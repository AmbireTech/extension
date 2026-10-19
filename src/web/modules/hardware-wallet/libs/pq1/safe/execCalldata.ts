// Recognise and decode Safe v1.3.0+ `execTransaction(...)` calldata.
//
// Unlike `approveHash`, no bundle is needed: the Safe transaction's fields
// are the call's arguments, and the device decodes them itself. Ambire
// decodes them too, with the device's exact acceptance rules, to:
//   1. skip the ERC-7730 lookup (the device's own Safe screens take
//      precedence over a descriptor);
//   2. refuse a DelegateCall early unless it is an allowlisted
//      MultiSendCallOnly batch (see `multiSend.ts`), as the device does;
//   3. find a CoW `setPreSignature` inside the Safe transaction, which needs
//      a CoW order bundle (see `transport/signRequest.ts`).
// Both sides either decode the same inner call or both refuse it. Like the
// device, Ambire treats any call with the `execTransaction` selector as a
// Safe transaction, so one it can't decode is refused, not signed some other
// way.

import {
  bytesToHex0x,
  readAddressWord,
  readU32Word,
  readUintBe,
  selectorMatches
} from '../transport/bytes'

/** `keccak256("execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)")[..4]`. */
export const SAFE_EXEC_TRANSACTION_SELECTOR = new Uint8Array([0x6a, 0x76, 0x12, 0x02])

/** Min calldata length: selector(4) + 10 head words(320) + 2 dynamic-length words(64). */
const SAFE_EXEC_TRANSACTION_MIN_CALLDATA_LEN = 4 + 10 * 32 + 2 * 32

/** True for calldata with the `execTransaction` selector, the device's
 *  trigger for its Safe checks: it treats any such call as a Safe
 *  transaction and refuses one `decodeExecTransaction` would reject. */
export function isSafeExecTransaction(data: Uint8Array): boolean {
  return selectorMatches(data, SAFE_EXEC_TRANSACTION_SELECTOR)
}

/** The fields of an `execTransaction` call that Ambire acts on. `data` is a
 *  subarray view of the input — don't mutate. */
export interface DecodedExecTransaction {
  /** Lower-cased 0x-hex inner-call target. */
  to: `0x${string}`
  value: bigint
  /** 0 = Call, 1 = DelegateCall. */
  operation: number
  /** Exact SafeTx `data` bytes (the calldata the Safe forwards on-chain). */
  data: Uint8Array
}

const EXEC_HEAD_WORDS = 10

/** Strict ABI decode of `execTransaction(...)`, with the device's exact
 *  acceptance rules:
 *
 *    * canonical address words for `to` / `gasToken` / `refundReceiver`
 *      (top 12 bytes zero);
 *    * `operation` word top-31-bytes zero and value ∈ {0, 1};
 *    * offset / length words fit in u32 (top 28 bytes zero);
 *    * both dynamic tails (`data`, `signatures`) start at or after the
 *      320-byte head and their `offset + 32 + len` stays in bounds.
 *
 *  Returns null on any violation — the same inputs the device refuses. */
export function decodeExecTransaction(cd: Uint8Array): DecodedExecTransaction | null {
  if (cd.length < SAFE_EXEC_TRANSACTION_MIN_CALLDATA_LEN || !isSafeExecTransaction(cd)) return null
  const head = cd.subarray(4)

  const to = readAddressWord(head, 0)
  if (to === null) return null
  const value = readUintBe(head, 32, 32)
  const dataOff = readU32Word(head, 2 * 32)
  if (dataOff === null) return null
  // operation: uint8 left-padded to 32 — top 31 bytes must be zero.
  for (let i = 3 * 32; i < 3 * 32 + 31; i++) if (head[i] !== 0) return null
  const operation = head[3 * 32 + 31]!
  if (operation > 1) return null
  // Head words 4..6 (safeTxGas, baseGas, gasPrice) accept any u256.
  if (readAddressWord(head, 7 * 32) === null) return null // gasToken
  if (readAddressWord(head, 8 * 32) === null) return null // refundReceiver
  const sigsOff = readU32Word(head, 9 * 32)
  if (sigsOff === null) return null

  const data = readDynamicBytes(head, dataOff)
  if (data === null) return null
  // `signatures` is unused by the host but its framing is part of the
  // firmware's acceptance set — validate it so the two sides agree.
  if (readDynamicBytes(head, sigsOff) === null) return null

  return { to: bytesToHex0x(to), value, operation, data }
}

/** Dynamic `bytes` tail at `head[offset..]`: `[u256 len][len bytes]`. The
 *  tail must sit at or after the 320-byte head (canonical Solidity
 *  encoding) and stay fully in bounds, as the device requires. */
function readDynamicBytes(head: Uint8Array, offset: number): Uint8Array | null {
  if (offset < EXEC_HEAD_WORDS * 32) return null
  if (offset + 32 > head.length) return null
  // Length word must itself fit in u32.
  const len = readU32Word(head, offset)
  if (len === null) return null
  const start = offset + 32
  if (start + len > head.length) return null
  return head.subarray(start, start + len)
}
