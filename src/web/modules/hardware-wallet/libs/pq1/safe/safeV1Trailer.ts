// The Safe transaction bundle (`safe_v1` in the firmware): what the device
// needs to show a Safe `approveHash(bytes32)` call, whose calldata carries
// only the hash of the transaction being approved.
//
//   1. Fetch the transaction behind the hash from the Safe Transaction
//      Service.
//   2. Refuse a DelegateCall unless it is an allowlisted MultiSendCallOnly
//      batch that passes every multiSend rule, as the device does.
//   3. Recompute `safeTxHash` and require it to equal the hash being
//      approved; a mismatch means the API answer can't be trusted.
//   4. Pack the bundle:
//
//   offset  size            field
//     0     281             canonical SafeTx fields (`canonical.ts`)
//     281   2 (u16 BE)      raw_data_len  (0..=4096)
//     283   raw_data_len    raw_data — exact inner-call calldata (for a
//                           multiSend batch: the FULL multiSend calldata;
//                           it must keccak to the canonical's data_hash)
//
// The device trusts none of it: it recomputes `data_hash` and the
// `safeTxHash`, checks the chain and the Safe address, and applies the same
// operation rules.

import { captureException } from '@common/config/analytics/CrashAnalytics.web'

import { SAFE_INNER_DATA_MAX_LEN, SAFE_TX_CANONICAL_LEN } from '../config'
import { bytesToHex0x, concatBytes, hexToBytes, isSameBytes, u16be } from '../transport/bytes'
import { fetchSafeTx, type SafeTxFields } from './api'
import { decodeApproveHash } from './calldata'
import { encodeSafeCanonical, safeDataHash } from './canonical'
import { computeSafeTxHash } from './eip712'
import { assertSafeOperationSignable } from './multiSend'

export interface BuildSafeV1TrailerInput {
  chainId: number | bigint
  /** The Safe the `approveHash` call goes to. The device checks that the
   *  bundle's Safe address is this call's target. */
  to: `0x${string}`
  /** Inner-call calldata — must be a 36-byte `approveHash(bytes32)`. */
  innerData: Uint8Array
}

export interface BuildSafeV1TrailerResult {
  safeV1Bundle: Uint8Array
  fields: SafeTxFields
}

/** The Safe transaction bundle for an `approveHash` call. Returns null when
 *  the call isn't `approveHash`. Throws on any failure once it is: the
 *  device refuses an `approveHash` without the bundle, so there is no
 *  fallback. */
export async function tryBuildSafeV1Trailer(
  args: BuildSafeV1TrailerInput
): Promise<BuildSafeV1TrailerResult | null> {
  const decoded = decodeApproveHash(args.innerData)
  if (!decoded) return null

  const safeTxHashHex = bytesToHex0x(decoded.safeTxHash)

  const fields = await fetchSafeTx(args.chainId, safeTxHashHex)

  const rawData = hexToBytes(fields.data)
  assertSafeOperationSignable(fields.operation, fields.to, rawData)

  // One canonical-fields object for both the trailer bytes and the local
  // safeTxHash re-derivation — if these two ever diverge (an edited field
  // mapping applied to only one) the tamper check below silently checks
  // the wrong thing.
  const canonicalFields = {
    chainId: args.chainId,
    safeAddress: args.to,
    to: fields.to,
    value: fields.value,
    dataHash: safeDataHash(rawData),
    operation: fields.operation,
    safeTxGas: fields.safeTxGas,
    baseGas: fields.baseGas,
    gasPrice: fields.gasPrice,
    gasToken: fields.gasToken,
    refundReceiver: fields.refundReceiver,
    nonce: fields.nonce
  }

  // Re-derive safeTxHash from the canonical and require it equals the
  // on-chain hash the dapp asked us to approve. The device re-derives it
  // too; checking here gives a clear refusal instead of one on the device.
  const recomputed = computeSafeTxHash(canonicalFields)
  if (!isSameBytes(recomputed, decoded.safeTxHash)) {
    const tampered = new Error(
      `Safe Transaction Service returned a SafeTx whose recomputed hash ${bytesToHex0x(
        recomputed
      )} does not match the approveHash argument ${safeTxHashHex}. Refusing to sign — possible API tampering or Safe v1.1.x domain.`
    )
    // The user only sees a refusal; a Safe API answer that doesn't match the
    // transaction being approved is worth a report.
    captureException(tampered)
    throw tampered
  }

  return { safeV1Bundle: packSafeV1Bundle(encodeSafeCanonical(canonicalFields), rawData), fields }
}

/** `canonical (281) || u16 BE raw_data_len || raw_data` — the Safe
 *  transaction bundle of both an on-chain `approveHash` and an off-chain
 *  Safe transaction sign (SIGN_OFFCHAIN kind 4). */
export function packSafeV1Bundle(canonical: Uint8Array, rawData: Uint8Array): Uint8Array {
  if (canonical.length !== SAFE_TX_CANONICAL_LEN) {
    throw new Error(`canonical length ${canonical.length} != ${SAFE_TX_CANONICAL_LEN}`)
  }
  if (rawData.length > SAFE_INNER_DATA_MAX_LEN) {
    throw new Error(
      `Safe inner raw_data is ${rawData.length} bytes, exceeds firmware cap ${SAFE_INNER_DATA_MAX_LEN}`
    )
  }
  return concatBytes([canonical, u16be(rawData.length), rawData])
}
