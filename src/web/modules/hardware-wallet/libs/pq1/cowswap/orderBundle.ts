// The CoW order bundle: what the device needs to show a CoW Protocol order
// before signing its `setPreSignature`, or before signing the order itself
// as typed data (SIGN_OFFCHAIN kind 5).
//
//   canonical          [u8; 204]          the order (`canonical.ts`)
//   [ sell_len u16 BE ][ sell_bundle ]    ERC-20 bundle of the sell token (optional)
//   [ buy_len  u16 BE ][ buy_bundle  ]    ERC-20 bundle of the buy token (optional)
//
// The device hashes the canonical order into its EIP-712 digest and checks
// it against the order uid in the calldata, so the order it shows is the
// order being signed. Each leg bundle must match the order's chain and that
// leg's token; a missing or mismatched leg is shown as the raw token address
// and amount instead.

import { captureException } from '@common/config/analytics/CrashAnalytics.web'

import { COW_ORDER_BUNDLE_MAX_LEN } from '../config'
import { reportClearSigningFallback } from '../db/common'
import { loadErc20Db } from '../erc20/db'
import { addressBytes, concatBytes, isSameBytes, u16be } from '../transport/bytes'
import { fetchCowOrder, isCowswapSupportedChain } from './api'
import { decodeSetPreSignature } from './calldata'
import { encodeCanonical } from './canonical'
import { buildOrderUid } from './eip712'
import { type GPv2Order, OrderUid } from './types'

export interface BuildCowOrderBundleInput {
  chainId: number | bigint
  /** Expected `orderUid.owner`: the wallet (UserOp sender) for a direct
   *  order, the Safe for a Safe-wrapped one. GPv2Settlement requires
   *  `uid.owner == msg.sender` at execution — and when the presign runs
   *  inside a Safe transaction, the Safe is `msg.sender`, not the wallet. */
  owner: `0x${string}`
  /** The setPreSignature calldata that will reach GPv2Settlement on-chain
   *  — the UserOp inner calldata for a direct order, the SafeTx `data`
   *  for a single-call Safe-wrapped one, or the unique presign record's
   *  164 bytes inside a Safe multiSend batch. */
  innerData: Uint8Array
}

export interface CowOrderBundle {
  cowOrderBundle: Uint8Array
  order: GPv2Order
  uid: OrderUid
}

/** The order bundle for a `setPreSignature` call. Returns null when the
 *  calldata isn't the strict 164-byte shape — which callers must treat as a
 *  refusal: the device refuses such a call too. Throws on any other failure
 *  (orderbook down, owner or uid mismatch); there is no fallback, because
 *  the device refuses a presign without a bundle. Only the two ERC-20 legs
 *  are optional (a lookup miss leaves a leg empty). */
export async function tryBuildCowOrderBundle(
  args: BuildCowOrderBundleInput
): Promise<CowOrderBundle | null> {
  const decoded = decodeSetPreSignature(args.innerData)
  if (!decoded) return null
  if (!decoded.signed) {
    throw new Error(
      'CoW setPreSignature(uid, false) cannot be clear-signed — only signed=true presignatures are supported'
    )
  }
  const chainNum = Number(args.chainId)
  if (!isCowswapSupportedChain(chainNum)) {
    throw new Error(`CoW Protocol not supported on chain ${chainNum}`)
  }

  const uidHex = decoded.uid.toHex()
  let detail: Awaited<ReturnType<typeof fetchCowOrder>>
  try {
    detail = await fetchCowOrder(chainNum, uidHex)
  } catch (e) {
    throw new Error(
      `Could not fetch CoW order ${uidHex} from the orderbook — it may not have been posted yet. Underlying error: ${e instanceof Error ? e.message : String(e)}`
    )
  }

  // The orderUid's embedded owner must equal the address that ends up as
  // `msg.sender` at GPv2Settlement — the wallet for a direct order, the
  // Safe for a Safe-wrapped one. CoW's setPreSignature reverts on-chain
  // otherwise (and the device refuses the bundle), but checking here gives
  // a clearer error than waiting for the bundler.
  if (detail.owner.toLowerCase() !== args.owner.toLowerCase()) {
    throw new Error(
      `CoW order owner ${detail.owner} does not match the expected pre-signing owner ${args.owner} ` +
        '(the wallet for a direct order; the Safe for a Safe-wrapped one)'
    )
  }

  const order: GPv2Order = {
    chainId: chainNum,
    sellToken: detail.sellToken,
    buyToken: detail.buyToken,
    receiver: detail.receiver,
    sellAmount: detail.sellAmount,
    buyAmount: detail.buyAmount,
    validTo: detail.validTo,
    appData: detail.appData,
    feeAmount: detail.feeAmount,
    kind: detail.kind,
    partiallyFillable: detail.partiallyFillable,
    sellTokenBalance: detail.sellTokenBalance,
    buyTokenBalance: detail.buyTokenBalance
  }

  // Reproduce the uid locally and require byte equality. If the orderbook
  // returned an order whose struct hash differs from the uid the dapp
  // submitted, the user would otherwise see one set of fields on the
  // hardware screen and sign a different one.
  const recomputed = buildOrderUid(order, args.owner)
  if (!isSameBytes(recomputed.bytes, decoded.uid.bytes)) {
    const tampered = new Error(
      `CoW orderbook returned an order whose hash (${recomputed.toHex()}) does not match the setPreSignature uid (${uidHex}). Refusing to sign — possible orderbook tampering.`
    )
    // The user only sees a refusal; an orderbook answer that doesn't match
    // the order being signed is worth a report.
    captureException(tampered)
    throw tampered
  }

  return { cowOrderBundle: await buildCowOrderBundle(order), order, uid: recomputed }
}

/** The bundle for `order`, with the ERC-20 bundles of its sell and buy
 *  tokens from the catalog (an empty leg on a miss). It is the same for a
 *  `setPreSignature` and for an order signed as typed data. */
export async function buildCowOrderBundle(order: GPv2Order): Promise<Uint8Array> {
  const [sell, buy] = await Promise.all([
    tryErc20Leg(order.chainId, order.sellToken),
    tryErc20Leg(order.chainId, order.buyToken)
  ])
  return packCowOrderBundle(order, { sell, buy })
}

/** `canonical (204) || u16 sell_len || sell || u16 buy_len || buy`; a
 *  missing leg bundle ships with length 0. */
export function packCowOrderBundle(
  order: GPv2Order,
  legs: { sell?: Uint8Array | null; buy?: Uint8Array | null } = {}
): Uint8Array {
  const sell = legs.sell ?? new Uint8Array(0)
  const buy = legs.buy ?? new Uint8Array(0)
  const bundle = concatBytes([
    encodeCanonical(order),
    u16be(sell.length),
    sell,
    u16be(buy.length),
    buy
  ])
  if (bundle.length > COW_ORDER_BUNDLE_MAX_LEN) {
    throw new Error(
      `CoW order bundle ${bundle.length} B exceeds the device's cap of ${COW_ORDER_BUNDLE_MAX_LEN} B`
    )
  }
  return bundle
}

/** The ERC-20 bundle of one order token, or null on a catalog miss or
 *  failure: the device then shows that token as a raw address and amount.
 *  The order itself is still fully checked by the device. */
async function tryErc20Leg(chainId: number, token: string): Promise<Uint8Array | null> {
  try {
    const db = await loadErc20Db()
    return db.buildBundle(chainId, addressBytes(token))
  } catch (e) {
    reportClearSigningFallback(`CoW ERC-20 leg lookup failed for ${token}; showing it raw`, e)
    return null
  }
}
