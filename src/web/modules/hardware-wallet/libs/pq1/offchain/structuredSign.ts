// The SIGN_OFFCHAIN request for typed data the device shows natively: a
// Safe `SafeTx` (kind 4) or a CoW `Order` (kind 5), as recognised by
// `classifyStructuredTypedData`. The device recomputes the EIP-712 hash from
// these bytes and signs exactly what a raw32 sign of that hash would, so the
// resulting signature verifies wherever the blind one did.

import { buildOffchainSafeTxSections } from '../aa/callTrailers'
import { CAP_OFFCHAIN_COW_ORDER, CAP_OFFCHAIN_SAFE_TX } from '../config'
import { buildCowOrderBundle } from '../cowswap/orderBundle'
import { encodeSafeCanonical } from '../safe/canonical'
import { packSafeV1Bundle } from '../safe/safeV1Trailer'
import type { SignOffchainRequest } from '../transport/offchain'
import type { StructuredTypedData } from './structuredTypedData'

type Structured = Exclude<StructuredTypedData, { kind: 'other' }>

/** A Safe transaction or CoW order request, without the header fields. */
export type StructuredOffchainRequest = Extract<
  SignOffchainRequest,
  { kind: 'safe_tx' | 'cow_order' }
>

/** The GET_DEVICE_INFO capability bit the device must report before Ambire
 *  sends this kind. */
export function structuredCapability(s: Structured): number {
  return s.kind === 'safe_tx' ? CAP_OFFCHAIN_SAFE_TX : CAP_OFFCHAIN_COW_ORDER
}

/** The kind-4 / kind-5 payload fields for `s`, with ERC-20 and name
 *  metadata from the catalogs (a miss makes the device show raw values, or
 *  refuse a call it knows needs the metadata). Throws a user-facing refusal
 *  for a Safe transaction the device would refuse (a DelegateCall outside
 *  MultiSendCallOnly, an unreadable CoW order it pre-signs, data too large
 *  to show). */
export async function buildStructuredOffchainRequest(
  s: Structured
): Promise<StructuredOffchainRequest> {
  if (s.kind === 'cow_order') {
    return { kind: 'cow_order', cowOrderBundle: await buildCowOrderBundle(s.order) }
  }
  const sections = await buildOffchainSafeTxSections(Number(s.chainId), s.safe, {
    operation: s.canonical.operation,
    to: s.canonical.to,
    data: s.rawData
  })
  return {
    kind: 'safe_tx',
    safeV1Bundle: packSafeV1Bundle(encodeSafeCanonical(s.canonical), s.rawData),
    ...sections
  }
}
