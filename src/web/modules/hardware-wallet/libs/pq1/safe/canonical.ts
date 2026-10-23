// The canonical Safe transaction fields: the fixed 281-byte layout the PQ1
// reads a Safe transaction from. All integers are big-endian.
//
//   [  0..  8)  chain_id          u64
//   [  8.. 28)  safe_address      20 B
//   [ 28.. 48)  to                20 B
//   [ 48.. 80)  value             u256
//   [ 80..112)  data_hash         bytes32  (keccak256(raw_data))
//   [112]       operation         u8  (0 = Call, 1 = DelegateCall)
//   [113..145)  safe_tx_gas       u256
//   [145..177)  base_gas          u256
//   [177..209)  gas_price         u256
//   [209..229)  gas_token         20 B
//   [229..249)  refund_receiver   20 B
//   [249..281)  nonce             u256

import { keccak256 } from 'viem'

import { SAFE_TX_CANONICAL_LEN } from '../config'
import { addressBytes, u256be, u64be } from '../transport/bytes'

/** Offset of the transaction's `to` in the canonical fields. */
export const SAFE_TX_TO_OFFSET = 28
/** Offset of the transaction's `operation` byte in the canonical fields. */
export const SAFE_TX_OPERATION_OFFSET = 112

/** A Safe transaction, as the canonical fields hold it. */
export interface SafeCanonical {
  chainId: number | bigint
  safeAddress: `0x${string}`
  to: `0x${string}`
  value: bigint
  /** keccak256 of the exact `execTransaction` inner `data` bytes. */
  dataHash: Uint8Array
  /** 0 = Call, 1 = DelegateCall. The device signs a DelegateCall only into
   *  an allowlisted MultiSendCallOnly batch (see `multiSend.ts`). */
  operation: number
  safeTxGas: bigint
  baseGas: bigint
  gasPrice: bigint
  gasToken: `0x${string}`
  refundReceiver: `0x${string}`
  nonce: bigint
}

/** Encode `c` in the canonical layout. */
export function encodeSafeCanonical(c: SafeCanonical): Uint8Array {
  if (c.dataHash.length !== 32) {
    throw new Error(`data_hash must be 32 bytes, got ${c.dataHash.length}`)
  }
  if (!Number.isInteger(c.operation) || c.operation < 0 || c.operation > 0xff) {
    throw new Error(`operation out of range: ${c.operation}`)
  }
  const out = new Uint8Array(SAFE_TX_CANONICAL_LEN)
  out.set(u64be(BigInt(c.chainId)), 0)
  out.set(addressBytes(c.safeAddress), 8)
  out.set(addressBytes(c.to), SAFE_TX_TO_OFFSET)
  out.set(u256be(c.value), 48)
  out.set(c.dataHash, 80)
  out[SAFE_TX_OPERATION_OFFSET] = c.operation
  out.set(u256be(c.safeTxGas), 113)
  out.set(u256be(c.baseGas), 145)
  out.set(u256be(c.gasPrice), 177)
  out.set(addressBytes(c.gasToken), 209)
  out.set(addressBytes(c.refundReceiver), 229)
  out.set(u256be(c.nonce), 249)
  return out
}

/** keccak256(raw_data). `raw_data` is the exact bytes the Safe will pass to
 *  `execTransaction` as its `data` argument — may be empty. */
export function safeDataHash(rawData: Uint8Array): Uint8Array {
  return keccak256(rawData, 'bytes')
}
