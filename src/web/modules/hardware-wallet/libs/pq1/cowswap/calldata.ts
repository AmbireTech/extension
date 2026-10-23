// Recognise and decode CoW Protocol `setPreSignature(bytes orderUid, bool
// signed)` calls on GPv2Settlement: an account pre-signing a CoW order.
//
// Calldata layout (164 bytes):
//   offset  size  field
//        0     4  selector      = 0xec6cb13f
//        4    32  bytes offset  = 0x40
//       36    32  bool signed   = 0 or 1
//       68    32  bytes length  = 56
//      100    64  bytes data    = orderUid (56) + 8 zero pad

import { selectorMatches } from '../transport/bytes'
import { GPV2_SETTLEMENT_ADDRESS } from './eip712'
import { OrderUid } from './types'

const SET_PRE_SIGNATURE_CALLDATA_LEN = 164
const SET_PRE_SIGNATURE_SELECTOR = new Uint8Array([0xec, 0x6c, 0xb1, 0x3f])

/** True for a call to GPv2Settlement with the `setPreSignature` selector,
 *  well-formed or not. The device refuses such a call without a CoW order
 *  bundle, malformed ones included (they must not fall back to blind
 *  signing), so this checks only the target and the selector, as the device
 *  does. */
export function isCowPresignClaim(to: string, data: Uint8Array): boolean {
  return (
    to.toLowerCase() === GPV2_SETTLEMENT_ADDRESS.toLowerCase() &&
    selectorMatches(data, SET_PRE_SIGNATURE_SELECTOR)
  )
}

/** Recognise CoW setPreSignature calldata and pull out (uid, signed). Returns
 *  null when the bytes don't fit the exact 164-byte ABI shape, which the
 *  device requires too. */
export function decodeSetPreSignature(data: Uint8Array): { uid: OrderUid; signed: boolean } | null {
  if (data.length !== SET_PRE_SIGNATURE_CALLDATA_LEN) return null
  if (!selectorMatches(data, SET_PRE_SIGNATURE_SELECTOR)) return null
  // Bytes offset slot at [4..36): 31 zero bytes then 0x40.
  for (let i = 4; i < 35; i++) if (data[i] !== 0) return null
  if (data[35] !== 0x40) return null
  // Bool signed slot at [36..68): 31 zero bytes then 0 or 1.
  for (let i = 36; i < 67; i++) if (data[i] !== 0) return null
  if (data[67] !== 0 && data[67] !== 1) return null
  // Bytes length slot at [68..100): 31 zero bytes then 56.
  for (let i = 68; i < 99; i++) if (data[i] !== 0) return null
  if (data[99] !== 56) return null
  const uidBytes = data.slice(100, 156)
  // Trailing zero pad at [156..164).
  for (let i = 156; i < 164; i++) if (data[i] !== 0) return null
  return { uid: new OrderUid(uidBytes), signed: data[67] === 1 }
}
