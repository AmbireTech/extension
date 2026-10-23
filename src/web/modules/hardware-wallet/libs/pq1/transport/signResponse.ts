// The device's reply to SIGN_USEROP and SIGN_USEROP_BATCH:
//
//   new_offchain_count u64 BE
//   init_code_len u32 BE, init_code
//   type1_len u32 BE, type1
//   type2_len u32 BE, type2

import { readU32Be, readU64Be } from './bytes'

/** A parsed sign reply. */
export type SignBundle = {
  /** Firmware-tracked off-chain sig counter for this slot. Must be embedded
   * in the submitted callData (`executeWithOffchainCount` arg 1). */
  newOffchainCount: bigint
  /** 4280-byte factory initCode, present when FLAG_INCLUDE_INIT_CODE was set. */
  initCode: Uint8Array | null
  /** 4128-byte `abi.encode(uint256 ownerIndex, bytes signature)` wrapper for
   *  the bootstrap key (ownerIndex=0). Only present when rotating to a new
   *  owner slot, which Ambire doesn't do. */
  type1: Uint8Array | null
  /** 4128-byte `abi.encode(uint256 ownerIndex, bytes signature)` wrapper for
   *  the active slot (ownerIndex=slotIndex+1). Always present. */
  type2: Uint8Array
}

/** Guarded u32 length-word read. Reading past the end of the buffer would
 *  produce `NaN` (undefined bytes), and `off + NaN > resp.length` is false —
 *  so an unguarded read lets a truncated response slip through the payload
 *  bounds checks below and silently yield an empty signature. */
function readLenWord(resp: Uint8Array, off: number, what: string): number {
  if (off + 4 > resp.length) throw new Error(`sign response truncated (${what} length)`)
  return readU32Be(resp, off)
}

/** Parse a sign reply (see the layout above). */
export function parseSignResponse(resp: Uint8Array): SignBundle {
  if (resp.length < 8 + 4 + 4 + 4) throw new Error('sign response too short')

  const newOffchainCount = readU64Be(resp, 0)
  let off = 8

  const icLen = readLenWord(resp, off, 'initCode')
  off += 4
  let initCode: Uint8Array | null = null
  if (icLen > 0) {
    if (off + icLen > resp.length) throw new Error('sign response truncated (initCode)')
    initCode = resp.slice(off, off + icLen)
    off += icLen
  }

  const t1Len = readLenWord(resp, off, 'type1')
  off += 4
  let type1: Uint8Array | null = null
  if (t1Len > 0) {
    if (off + t1Len > resp.length) throw new Error('sign response truncated (type1)')
    type1 = resp.slice(off, off + t1Len)
    off += t1Len
  }

  const t2Len = readLenWord(resp, off, 'type2')
  off += 4
  if (t2Len === 0) throw new Error('sign response missing type2 signature')
  if (off + t2Len > resp.length) throw new Error('sign response truncated (type2)')
  const type2 = resp.slice(off, off + t2Len)

  return { newOffchainCount, initCode, type1, type2 }
}
