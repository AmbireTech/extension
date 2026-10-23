// The EIP-712 digest and uid of a CoW Protocol (GPv2) order. The device
// computes the same digest from the canonical order it shows.

import { keccak256, stringToBytes } from 'viem'

import { addressBytes, u256be, u32be } from '../transport/bytes'
import {
  type BuyTokenBalance,
  type GPv2Order,
  OrderUid,
  type OrderKind,
  type SellTokenBalance
} from './types'

/** CoW Protocol's settlement contract, the EIP-712 `verifyingContract` of
 *  every order (same address on every chain). */
export const GPV2_SETTLEMENT_ADDRESS = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41' as const

const keccakOfText = (text: string) => keccak256(stringToBytes(text), 'bytes')

const DOMAIN_TYPEHASH = keccakOfText(
  'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
)

// CoW's canonical type declares kind / sellTokenBalance / buyTokenBalance as
// `string`, not `bytes32`. Getting this wrong yields a different typehash and
// every uid we derive mismatches the orderbook.
const ORDER_TYPEHASH = keccakOfText(
  'Order(address sellToken,address buyToken,address receiver,uint256 sellAmount,uint256 buyAmount,uint32 validTo,bytes32 appData,uint256 feeAmount,string kind,bool partiallyFillable,string sellTokenBalance,string buyTokenBalance)'
)

const DOMAIN_NAME_HASH = keccakOfText('Gnosis Protocol')
const DOMAIN_VERSION_HASH = keccakOfText('v2')

const KIND_HASH: Record<OrderKind, Uint8Array> = {
  sell: keccakOfText('sell'),
  buy: keccakOfText('buy')
}
const SELL_BALANCE_HASH: Record<SellTokenBalance, Uint8Array> = {
  erc20: keccakOfText('erc20'),
  external: keccakOfText('external'),
  internal: keccakOfText('internal')
}
const BUY_BALANCE_HASH: Record<BuyTokenBalance, Uint8Array> = {
  erc20: keccakOfText('erc20'),
  internal: keccakOfText('internal')
}

function domainSeparator(chainId: number): Uint8Array {
  const buf = new Uint8Array(32 * 5)
  buf.set(DOMAIN_TYPEHASH, 0)
  buf.set(DOMAIN_NAME_HASH, 32)
  buf.set(DOMAIN_VERSION_HASH, 64)
  buf.set(u256be(BigInt(chainId)), 96)
  buf.set(addressBytes(GPV2_SETTLEMENT_ADDRESS), 128 + 12)
  return keccak256(buf, 'bytes')
}

function structHash(order: GPv2Order): Uint8Array {
  if (order.appData.length !== 32) throw new Error('appData must be 32 bytes')
  const buf = new Uint8Array(32 * 13)
  buf.set(ORDER_TYPEHASH, 0)
  buf.set(addressBytes(order.sellToken), 32 + 12)
  buf.set(addressBytes(order.buyToken), 64 + 12)
  buf.set(addressBytes(order.receiver), 96 + 12)
  buf.set(u256be(order.sellAmount), 128)
  buf.set(u256be(order.buyAmount), 160)
  buf.set(u32be(order.validTo), 192 + 28)
  buf.set(order.appData, 224)
  buf.set(u256be(order.feeAmount), 256)
  buf.set(KIND_HASH[order.kind], 288)
  buf[320 + 31] = order.partiallyFillable ? 1 : 0
  buf.set(SELL_BALANCE_HASH[order.sellTokenBalance], 352)
  buf.set(BUY_BALANCE_HASH[order.buyTokenBalance], 384)
  return keccak256(buf, 'bytes')
}

/** The EIP-712 digest of `order` under the GPv2Settlement domain for
 *  `order.chainId` — what an EIP-1271 CoW order signature signs, and the
 *  first 32 bytes of its uid. */
export function computeOrderDigest(order: GPv2Order): Uint8Array {
  const buf = new Uint8Array(2 + 32 + 32)
  buf[0] = 0x19
  buf[1] = 0x01
  buf.set(domainSeparator(order.chainId), 2)
  buf.set(structHash(order), 34)
  return keccak256(buf, 'bytes')
}

/** The order's uid: its digest, its owner and its `validTo`. */
export function buildOrderUid(order: GPv2Order, owner: `0x${string}`): OrderUid {
  const out = new Uint8Array(56)
  out.set(computeOrderDigest(order), 0)
  out.set(addressBytes(owner), 32)
  out.set(u32be(order.validTo), 52)
  return new OrderUid(out)
}
