// The canonical CoW order: the fixed 204-byte layout a CoW order bundle
// carries. The device hashes it into the order's EIP-712 digest and checks
// that against the order uid being signed. All integers are big-endian.
//
//   [  0..  8)  chain_id           u64
//   [  8.. 28)  sellToken          20-byte address
//   [ 28.. 48)  buyToken           20 B
//   [ 48.. 68)  receiver           20 B
//   [ 68..100)  sellAmount         u256
//   [100..132)  buyAmount          u256
//   [132..164)  feeAmount          u256
//   [164..168)  validTo            u32
//   [168]       kind               0=sell / 1=buy
//   [169]       partiallyFillable  0/1
//   [170]       sellTokenBalance   0/1/2
//   [171]       buyTokenBalance    0/1
//   [172..204)  appData            bytes32

import { COW_ORDER_CANONICAL_LEN } from '../config'
import { addressBytes, u256be, u32be, u64be } from '../transport/bytes'
import { buyTokenBalanceByte, type GPv2Order, orderKindByte, sellTokenBalanceByte } from './types'

/** Encode `order` in the canonical layout. */
export function encodeCanonical(order: GPv2Order): Uint8Array {
  if (order.appData.length !== 32) {
    throw new Error(`appData must be 32 bytes, got ${order.appData.length}`)
  }
  const out = new Uint8Array(COW_ORDER_CANONICAL_LEN)
  out.set(u64be(BigInt(order.chainId)), 0)
  out.set(addressBytes(order.sellToken), 8)
  out.set(addressBytes(order.buyToken), 28)
  out.set(addressBytes(order.receiver), 48)
  out.set(u256be(order.sellAmount), 68)
  out.set(u256be(order.buyAmount), 100)
  out.set(u256be(order.feeAmount), 132)
  out.set(u32be(order.validTo), 164)
  out[168] = orderKindByte(order.kind)
  out[169] = order.partiallyFillable ? 1 : 0
  out[170] = sellTokenBalanceByte(order.sellTokenBalance)
  out[171] = buyTokenBalanceByte(order.buyTokenBalance)
  out.set(order.appData, 172)
  return out
}
