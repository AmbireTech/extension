// The SIGN_OFFCHAIN request for typed data the device shows natively: a
// Safe `SafeTx` (kind 4), a CoW `Order` (kind 5) or a Uniswap Permit2 permit
// (kind 6), as recognised by `classifyStructuredTypedData`. The device
// recomputes the EIP-712 hash from these bytes and signs exactly what a
// raw32 sign of that hash would, so the resulting signature verifies
// wherever the blind one did.

import { buildOffchainSafeTxSections } from '../aa/callTrailers'
import { CAP_OFFCHAIN_COW_ORDER, CAP_OFFCHAIN_PERMIT2, CAP_OFFCHAIN_SAFE_TX } from '../config'
import { buildCowOrderBundle } from '../cowswap/orderBundle'
import { buildErc20BundleFor } from '../erc20/detect'
import { buildNameBundles } from '../names/resolve'
import { encodeSafeCanonical } from '../safe/canonical'
import { packSafeV1Bundle } from '../safe/safeV1Trailer'
import { addressBytes } from '../transport/bytes'
import type { SignOffchainRequest } from '../transport/offchain'
import type { StructuredTypedData } from './structuredTypedData'

/** Typed data the device shows natively. */
type Structured = Exclude<StructuredTypedData, { kind: 'other' | 'refused' }>

/** A Safe transaction, CoW order or Permit2 permit request, without the
 *  header fields. */
export type StructuredOffchainRequest = Extract<
  SignOffchainRequest,
  { kind: 'safe_tx' | 'cow_order' | 'permit2' }
>

/** The GET_DEVICE_INFO capability bit the device must report before Ambire
 *  sends this kind. */
export function structuredCapability(s: Structured): number {
  switch (s.kind) {
    case 'safe_tx':
      return CAP_OFFCHAIN_SAFE_TX
    case 'cow_order':
      return CAP_OFFCHAIN_COW_ORDER
    case 'permit2':
      return CAP_OFFCHAIN_PERMIT2
  }
}

/** The kind-4 / 5 / 6 payload fields for `s`, with ERC-20 and name metadata
 *  from the catalogs (a miss makes the device show raw values, or refuse a
 *  call it knows needs the metadata). Throws a user-facing refusal for a
 *  Safe transaction the device would refuse (a DelegateCall outside
 *  MultiSendCallOnly, an unreadable CoW order it pre-signs, data too large
 *  to show). */
export async function buildStructuredOffchainRequest(
  s: Structured
): Promise<StructuredOffchainRequest> {
  if (s.kind === 'cow_order') {
    return { kind: 'cow_order', cowOrderBundle: await buildCowOrderBundle(s.order) }
  }
  if (s.kind === 'permit2') {
    // Each token's metadata (a miss shows its address and raw amount) and
    // the spender's name (a miss shows its address).
    const erc20Bundles = await Promise.all(
      s.permit.tokens.map((t) => buildErc20BundleFor(s.chainId, addressBytes(t.token)))
    )
    const nameBundles = await buildNameBundles(s.chainId, [addressBytes(s.permit.spender)])
    return { kind: 'permit2', permit2Canonical: s.canonical, erc20Bundles, nameBundles }
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
