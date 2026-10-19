// Recognise and decode Safe `approveHash(bytes32)` calldata: a Safe owner
// approving a Safe transaction by its hash.

import { selectorMatches } from '../transport/bytes'

/** `keccak256("approveHash(bytes32)")[..4]`. */
const SAFE_APPROVE_HASH_SELECTOR = new Uint8Array([0xd4, 0xd9, 0xbd, 0xcd])

/** Selector and the 32-byte hash. */
const SAFE_APPROVE_HASH_CALLDATA_LEN = 36

/** A decoded `approveHash` call. */
export interface ApproveHashCall {
  /** Bytes 4..36 of the calldata — the SafeTx EIP-712 hash being approved. */
  safeTxHash: Uint8Array
}

/** True for calldata with the `approveHash` selector. The device treats any
 *  such call as a Safe approval, and refuses one that isn't a strict 36-byte
 *  `approveHash` with its Safe transaction bundle. */
export function isApproveHashClaim(data: Uint8Array): boolean {
  return selectorMatches(data, SAFE_APPROVE_HASH_SELECTOR)
}

/** Returns null when the calldata isn't a strict 36-byte `approveHash` call,
 *  the only shape the device signs. */
export function decodeApproveHash(data: Uint8Array): ApproveHashCall | null {
  if (data.length !== SAFE_APPROVE_HASH_CALLDATA_LEN || !isApproveHashClaim(data)) return null
  return { safeTxHash: data.slice(4, 36) }
}
