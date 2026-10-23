// The ERC-7730 descriptor bundle for a call or for EIP-712 typed data.
//
// Every lookup can come back empty: the catalog failed to load, it has no
// descriptor for the contract, or the descriptor doesn't cover this call.
// The request then goes without one, and the device applies its own rule:
// blind signing, or a refusal for a call it knows must be clear-signed.
// Leaving a descriptor out can't downgrade such a call.

import { reportClearSigningFallback } from '../db/common'
import { addressBytes } from '../transport/bytes'
import { CTX_CONTRACT, loadErc7730Catalog } from './catalog'
import { findIrFormat, tokenAmountAddresses } from './ir'

/** The descriptor bundle for a call, plus the tokens its `tokenAmount`
 *  fields are in for this call, so their ERC-20 bundles can be attached too
 *  (see `aa/callTrailers.ts`). */
export type Erc7730CallRoute = {
  bundle: Uint8Array
  tokenAddresses: Uint8Array[]
}

/** The descriptor bundle for a call to `to` with calldata `data` on
 *  `chainId`, or null.
 *
 *  A descriptor without a format for the call's selector counts as none:
 *  the device binds a descriptor to the call it is attached to and refuses
 *  the call when the selector isn't covered, while without one it applies
 *  its own rule for the call (see above). */
export async function buildErc7730BundleForCall(args: {
  chainId: number | bigint
  to: `0x${string}`
  data: Uint8Array
}): Promise<Erc7730CallRoute | null> {
  const contract = addressBytes(args.to)
  let catalog
  try {
    catalog = await loadErc7730Catalog()
  } catch (e) {
    reportClearSigningFallback('erc7730 catalog unavailable — falling back to blind-sign', e)
    return null
  }
  const entry = catalog.find(args.chainId, contract, CTX_CONTRACT)
  if (!entry) return null
  const view = catalog.parseIr(entry)
  const format = view ? findIrFormat(view, args.data.subarray(0, 4)) : undefined
  if (!format) return null
  try {
    return {
      bundle: catalog.assembleTrailer(entry),
      tokenAddresses: tokenAmountAddresses(format, { to: contract, data: args.data })
    }
  } catch (e) {
    reportClearSigningFallback('erc7730 trailer assembly failed — falling back to blind-sign', e)
    return null
  }
}

/** The descriptor bundle for EIP-712 typed data, or null; the signer then
 *  signs the EIP-712 hash blind. */
export async function buildErc7730BundleForEip712(args: {
  chainId: number | bigint
  verifyingContract: `0x${string}`
  /** `keccak256(typeString)` of the primary type. The device finds the
   *  descriptor's format by all 32 bytes of it. */
  primaryTypeHash: Uint8Array
}): Promise<Uint8Array | null> {
  const contract = addressBytes(args.verifyingContract)
  let catalog
  try {
    catalog = await loadErc7730Catalog()
  } catch (e) {
    reportClearSigningFallback('erc7730 catalog unavailable — falling back to raw32', e)
    return null
  }
  const entry = catalog.findEip712(args.chainId, contract, args.primaryTypeHash)
  if (!entry) return null
  try {
    return catalog.assembleTrailer(entry)
  } catch (e) {
    reportClearSigningFallback('erc7730 trailer assembly failed — falling back to raw32', e)
    return null
  }
}
