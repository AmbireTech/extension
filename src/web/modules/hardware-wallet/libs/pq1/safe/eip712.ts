// The `safeTxHash` of a Safe ≥ v1.3.0 transaction: its EIP-712 hash under
// the chain-specific domain `EIP712Domain(uint256 chainId,address
// verifyingContract)`. Safe v1.1.x used a domain without the chain, which
// the PQ1 doesn't support. The device computes the same hash; Ambire
// computes it to check a Safe transaction before sending it to the device.

import { keccak256, stringToBytes } from 'viem'

import { addressBytes, u256be } from '../transport/bytes'
import type { SafeCanonical } from './canonical'

const SAFE_DOMAIN_TYPEHASH = keccak256(
  stringToBytes('EIP712Domain(uint256 chainId,address verifyingContract)'),
  'bytes'
)

const SAFE_TX_TYPEHASH = keccak256(
  stringToBytes(
    'SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)'
  ),
  'bytes'
)

function domainSeparator(chainId: bigint, safeAddress: `0x${string}`): Uint8Array {
  const buf = new Uint8Array(32 * 3)
  buf.set(SAFE_DOMAIN_TYPEHASH, 0)
  buf.set(u256be(chainId), 32)
  buf.set(addressBytes(safeAddress), 64 + 12)
  return keccak256(buf, 'bytes')
}

function structHash(c: SafeCanonical): Uint8Array {
  if (c.dataHash.length !== 32) throw new Error('dataHash must be 32 bytes')
  const buf = new Uint8Array(32 * 11)
  buf.set(SAFE_TX_TYPEHASH, 0)
  buf.set(addressBytes(c.to), 32 + 12)
  buf.set(u256be(c.value), 64)
  buf.set(c.dataHash, 96)
  buf[128 + 31] = c.operation & 0xff
  buf.set(u256be(c.safeTxGas), 160)
  buf.set(u256be(c.baseGas), 192)
  buf.set(u256be(c.gasPrice), 224)
  buf.set(addressBytes(c.gasToken), 256 + 12)
  buf.set(addressBytes(c.refundReceiver), 288 + 12)
  buf.set(u256be(c.nonce), 320)
  return keccak256(buf, 'bytes')
}

/** The EIP-712 `safeTxHash` of a Safe transaction. */
export function computeSafeTxHash(c: SafeCanonical): Uint8Array {
  const buf = new Uint8Array(2 + 32 + 32)
  buf[0] = 0x19
  buf[1] = 0x01
  buf.set(domainSeparator(BigInt(c.chainId), c.safeAddress), 2)
  buf.set(structHash(c), 34)
  return keccak256(buf, 'bytes')
}
