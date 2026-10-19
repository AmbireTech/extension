// The clear-signing bundles attached to a PQ1 transaction, call by call:
// what lets the device show "Send 25 USDC to vitalik.eth" instead of raw
// calldata. Also the bundles of a Safe transaction signed off-chain (see
// `offchain/structuredSign.ts`).
//
// A missing ERC-20, name, function-name or ERC-7730 bundle never makes the
// device show something false: it shows less, or refuses a call it knows
// needs the bundle (such as a token transfer whose descriptor is missing).
// The Safe and CoW bundles are different: the device always refuses an
// `approveHash` or a CoW `setPreSignature` without them, so failing to
// build one refuses the request with a `Pq1UserError` first.

import { MAX_TX_LEN } from '../config'
import { isCowPresignClaim } from '../cowswap/calldata'
import { tryBuildCowOrderBundle } from '../cowswap/orderBundle'
import { reportClearSigningFallback } from '../db/common'
import {
  buildErc20BundleFor,
  firstKnownErc20Bundle,
  resolveErc20Bundle,
  resolveSafeTxErc20Token,
  type SafeTxInnerCall
} from '../erc20/detect'
import { isErc20MethodCall } from '../erc20/selectors'
import { buildErc7730BundleForCall } from '../erc7730/lookup'
import { Pq1UserError, TOO_LARGE_FOR_DEVICE_MESSAGE } from '../errors'
import {
  buildNameBundles,
  collectDisplayAddresses,
  collectSafeTxDisplayAddresses
} from '../names/resolve'
import { isApproveHashClaim } from '../safe/calldata'
import { decodeExecTransaction, isSafeExecTransaction } from '../safe/execCalldata'
import { assertSafeOperationSignable, resolveSafeCowBinding } from '../safe/multiSend'
import { tryBuildSafeV1Trailer } from '../safe/safeV1Trailer'
import { loadSelectorsDb } from '../selectors/db'
import { addressBytes, hexToBytes } from '../transport/bytes'
import type { CallBundles } from '../transport/signRequest'

/** Shown when the device refuses a Safe transaction outright, so the user
 *  learns why before nothing happens on the device. */
const SAFE_REFUSED_MESSAGE =
  "The PQ1 won't sign this Safe transaction because it includes an action the device doesn't allow, or its details couldn't be checked. Nothing was sent."

/** Shown when the details of a CoW Swap order can't be read, so the device
 *  couldn't show the user what they are approving. */
const COW_ORDER_UNREADABLE_MESSAGE =
  "The PQ1 can't sign this swap because the order details couldn't be read, so it couldn't show you what you're approving. Nothing was sent."

type Call = { to: `0x${string}`; value: bigint; data: `0x${string}` }

/** The bundles chosen for one call, plus what they reveal that other
 *  bundles need. */
type ClearSignRoute = Pick<CallBundles, 'cowOrderBundle' | 'safeV1Bundle' | 'erc7730Bundle'> & {
  /** The receiver of a pre-signed CoW order, which the device shows. */
  cowReceiver?: string
  /** The Safe transaction behind an `approveHash`, which the device shows. */
  safeInner?: SafeTxInnerCall
  /** The tokens an ERC-7730 descriptor's amounts are in. */
  erc7730TokenAddresses?: Uint8Array[]
}

const errorText = (e: unknown): string => (e instanceof Error ? e.message : String(e))

/**
 * The bundles for each of `calls` (built in parallel), plus the name
 * bundles for every address the device will show.
 *
 * Each call gets, by priority: a CoW order bundle (for `setPreSignature` on
 * GPv2Settlement), a Safe transaction bundle (for `approveHash`), the Safe
 * checks (for `execTransaction`), or an ERC-7730 descriptor. A Safe
 * transaction that pre-signs a CoW order — directly, or as the one
 * `setPreSignature` in a MultiSendCallOnly batch, the shape the Safe app
 * uses — gets both, with the order bound to the Safe as its owner. Then the
 * ERC-20 bundle of the token the call moves, and, for a call the device has
 * no decoder for, the function-name bundle.
 */
export async function buildCallTrailers(args: {
  chainId: number
  sender: `0x${string}`
  calls: readonly Call[]
}): Promise<{ perCallTrailers: CallBundles[]; nameBundles: Uint8Array[] }> {
  const { chainId } = args
  const perCall = await Promise.all(
    args.calls.map(async (c) => {
      const innerData = hexToBytes(c.data)
      const route = await resolveClearSignRoute(chainId, args.sender, c.to, innerData)
      // The ERC-20 bundle: the token called directly or inside a Safe
      // transaction, else the token behind an approveHash's Safe
      // transaction, else the token an ERC-7730 descriptor's amount is in.
      const erc20Bundle =
        (await resolveErc20Bundle(chainId, c.to, innerData)) ??
        (route.safeInner ? await resolveSafeTxErc20Bundle(chainId, route.safeInner) : undefined) ??
        (await firstKnownErc20Bundle(chainId, route.erc7730TokenAddresses ?? []))
      const selectorBundle = hasDeviceDecoder(innerData, route, erc20Bundle)
        ? undefined
        : await buildSelectorBundle(innerData)

      // Every address the device will show for this call; deduplicated and
      // capped across the whole request below.
      const nameAddrs = collectDisplayAddresses(c.to, innerData)
      if (route.safeInner) nameAddrs.push(...collectSafeTxDisplayAddresses(route.safeInner))
      if (route.cowReceiver) nameAddrs.push(addressBytes(route.cowReceiver))

      const trailers: CallBundles = {
        erc20Bundle,
        cowOrderBundle: route.cowOrderBundle,
        safeV1Bundle: route.safeV1Bundle,
        erc7730Bundle: route.erc7730Bundle,
        selectorBundle
      }
      return { trailers, nameAddrs }
    })
  )
  // Name bundles apply to the whole request.
  const nameBundles = await buildNameBundles(
    chainId,
    perCall.flatMap((x) => x.nameAddrs)
  )
  return { perCallTrailers: perCall.map((x) => x.trailers), nameBundles }
}

/** True when the device shows this call through a decoder of its own —
 *  ERC-20, Safe, CoW or an ERC-7730 descriptor. Only the other calls are
 *  blind-signed, where a function-name bundle names the function. */
function hasDeviceDecoder(
  innerData: Uint8Array,
  route: ClearSignRoute,
  erc20Bundle: Uint8Array | undefined
): boolean {
  return (
    erc20Bundle !== undefined ||
    route.erc7730Bundle !== undefined ||
    route.cowOrderBundle !== undefined ||
    route.safeV1Bundle !== undefined ||
    isErc20MethodCall(innerData) ||
    isSafeExecTransaction(innerData)
  )
}

/** The function-name bundle for `innerData`, or undefined on a miss or a
 *  catalog failure (the device then shows the raw selector). Never throws. */
async function buildSelectorBundle(innerData: Uint8Array): Promise<Uint8Array | undefined> {
  try {
    const db = await loadSelectorsDb()
    return db.buildBundle(innerData) ?? undefined
  } catch (e) {
    reportClearSigningFallback('selector bundle lookup failed; showing the raw selector', e)
    return undefined
  }
}

/** The ERC-20 bundle for the token a Safe transaction moves, if any. */
async function resolveSafeTxErc20Bundle(
  chainId: number,
  inner: SafeTxInnerCall
): Promise<Uint8Array | undefined> {
  const token = resolveSafeTxErc20Token(inner)
  return token ? buildErc20BundleFor(chainId, token) : undefined
}

async function resolveClearSignRoute(
  chainId: number,
  sender: `0x${string}`,
  to: `0x${string}`,
  innerData: Uint8Array
): Promise<ClearSignRoute> {
  if (isCowPresignClaim(to, innerData)) {
    const built = await requireCowOrderBundle(chainId, sender, innerData, 'CoW')
    return { cowOrderBundle: built.cowOrderBundle, cowReceiver: built.order.receiver }
  }
  // Matched on the selector alone, like the device: a call with either Safe
  // selector is a Safe call to it, signed only if it decodes strictly.
  if (isApproveHashClaim(innerData)) return resolveSafeApproveHash(chainId, to, innerData)
  if (isSafeExecTransaction(innerData)) return resolveSafeExecTransaction(chainId, to, innerData)
  const erc7730 = await buildErc7730BundleForCall({ chainId, to, data: innerData })
  if (!erc7730) return {}
  return { erc7730Bundle: erc7730.bundle, erc7730TokenAddresses: erc7730.tokenAddresses }
}

/** The CoW order bundle for a presign the device refuses to sign without
 *  it. Any failure to build it (orderbook down, calldata the device won't
 *  decode) is therefore a refusal. */
async function requireCowOrderBundle(
  chainId: number,
  owner: `0x${string}`,
  presignCalldata: Uint8Array,
  label: 'CoW' | 'Safe-wrapped CoW'
) {
  let built: Awaited<ReturnType<typeof tryBuildCowOrderBundle>>
  try {
    built = await tryBuildCowOrderBundle({ chainId, owner, innerData: presignCalldata })
  } catch (e) {
    throw new Pq1UserError(
      COW_ORDER_UNREADABLE_MESSAGE,
      `${label} order bundle build failed: ${errorText(e)}`
    )
  }
  if (!built) {
    // `isCowPresignClaim` matches on target and selector, like the device,
    // so calldata that then fails the strict decode is calldata the device
    // refuses whatever is attached.
    throw new Pq1UserError(
      COW_ORDER_UNREADABLE_MESSAGE,
      `${label} setPreSignature calldata is malformed — the PQ1 firmware refuses to sign it.`
    )
  }
  return built
}

const safeMultiSendRefusal = (banner: string) =>
  new Pq1UserError(
    SAFE_REFUSED_MESSAGE,
    `Safe multiSend batch refused by PQ1 firmware ("Safe sign / ${banner}").`
  )

async function resolveSafeApproveHash(
  chainId: number,
  safe: `0x${string}`,
  innerData: Uint8Array
): Promise<ClearSignRoute> {
  // tryBuildSafeV1Trailer throws once the call IS an approveHash and the
  // bundle can't be built (Safe API failure, hash mismatch, multiSend rule
  // broken) — the device refuses approveHash without it.
  let built: Awaited<ReturnType<typeof tryBuildSafeV1Trailer>>
  try {
    built = await tryBuildSafeV1Trailer({ chainId, to: safe, innerData })
  } catch (e) {
    throw new Pq1UserError(SAFE_REFUSED_MESSAGE, `Safe v1 trailer build failed: ${errorText(e)}`)
  }
  // Null when the calldata isn't the strict 36-byte approveHash, which the
  // device refuses whatever is attached.
  if (!built) {
    throw new Pq1UserError(
      SAFE_REFUSED_MESSAGE,
      `Safe approveHash calldata of ${innerData.length} bytes, not 36 — the PQ1 firmware refuses to sign it.`
    )
  }
  // The Safe transaction the device will rebuild from the bundle and show:
  // its token and addresses get metadata like a direct call's would.
  const safeTxData = hexToBytes(built.fields.data)
  const safeInner: SafeTxInnerCall = {
    operation: built.fields.operation,
    to: built.fields.to,
    data: safeTxData
  }
  // A Safe-wrapped CoW pre-sign: the Safe transaction calls setPreSignature
  // on GPv2Settlement, directly or as the one presign record of an
  // allowlisted MultiSendCallOnly batch (the Safe app's approve + presign).
  // Its order bundle must bind to that exact presign calldata, with the
  // Safe as the order owner. A batch breaking a rule was already refused by
  // tryBuildSafeV1Trailer, so `refuse` can't happen here.
  const binding = resolveSafeCowBinding(built.fields.operation, built.fields.to, safeTxData)
  if (binding.kind === 'refuse') throw safeMultiSendRefusal(binding.banner)
  if (binding.kind !== 'bind') return { safeV1Bundle: built.safeV1Bundle, safeInner }
  const order = await requireCowOrderBundle(chainId, safe, binding.calldata, 'Safe-wrapped CoW')
  return {
    cowOrderBundle: order.cowOrderBundle,
    safeV1Bundle: built.safeV1Bundle,
    cowReceiver: order.order.receiver,
    safeInner
  }
}

async function resolveSafeExecTransaction(
  chainId: number,
  safe: `0x${string}`,
  innerData: Uint8Array
): Promise<ClearSignRoute> {
  // No Safe transaction bundle is needed: the device decodes the fields
  // straight out of the call. A DelegateCall is signable only as an
  // allowlisted MultiSendCallOnly batch; anything else is refused here, as
  // the device would. No ERC-7730 lookup either: the device's own Safe
  // screens take precedence over a descriptor.
  //
  // A Safe transaction that pre-signs a CoW order still needs the order
  // bundle, bound to the Safe transaction's `data` or to the one presign
  // record of a multiSend batch. The decode applies the device's rules, so
  // when it fails here it fails on the device too, and is refused here.
  const exec = decodeExecTransaction(innerData)
  if (!exec) {
    throw new Pq1UserError(
      SAFE_REFUSED_MESSAGE,
      'Safe execTransaction calldata is not decodable — the PQ1 firmware refuses to sign it.'
    )
  }
  if (exec.operation === 1) {
    // Throws unless the inner call is a rule-passing batch on a canonical
    // MultiSendCallOnly deployment.
    try {
      assertSafeOperationSignable(exec.operation, exec.to, exec.data)
    } catch (e) {
      throw new Pq1UserError(SAFE_REFUSED_MESSAGE, errorText(e))
    }
  }
  const binding = resolveSafeCowBinding(exec.operation, exec.to, exec.data)
  if (binding.kind === 'refuse') throw safeMultiSendRefusal(binding.banner)
  if (binding.kind !== 'bind') return {}
  const order = await requireCowOrderBundle(chainId, safe, binding.calldata, 'Safe-wrapped CoW')
  return { cowOrderBundle: order.cowOrderBundle, cowReceiver: order.order.receiver }
}

/** The bundles of a Safe transaction signed off-chain (SIGN_OFFCHAIN kind
 *  4), besides the transaction itself: the ERC-20 bundle of its token, the
 *  CoW order bundle when it pre-signs a CoW order (owner = the Safe; the
 *  device requires it then and refuses it otherwise), and name bundles for
 *  the addresses the device shows. Applies the device's Safe operation rules
 *  and refuses, in words the user understands, a transaction it would
 *  refuse. */
export async function buildOffchainSafeTxSections(
  chainId: number,
  safe: `0x${string}`,
  inner: SafeTxInnerCall
): Promise<{ erc20Bundle?: Uint8Array; cowOrderBundle?: Uint8Array; nameBundles: Uint8Array[] }> {
  if (inner.data.length > MAX_TX_LEN) {
    throw new Pq1UserError(
      TOO_LARGE_FOR_DEVICE_MESSAGE,
      `SafeTx data of ${inner.data.length} bytes > MAX_TX_LEN (${MAX_TX_LEN})`
    )
  }
  try {
    assertSafeOperationSignable(inner.operation, inner.to, inner.data)
  } catch (e) {
    throw new Pq1UserError(SAFE_REFUSED_MESSAGE, errorText(e))
  }
  const binding = resolveSafeCowBinding(inner.operation, inner.to, inner.data)
  if (binding.kind === 'refuse') throw safeMultiSendRefusal(binding.banner)
  const order =
    binding.kind === 'bind'
      ? await requireCowOrderBundle(chainId, safe, binding.calldata, 'Safe-wrapped CoW')
      : undefined
  const nameAddrs = [...collectSafeTxDisplayAddresses(inner), addressBytes(safe)]
  if (order) nameAddrs.push(addressBytes(order.order.receiver))
  const [erc20Bundle, nameBundles] = await Promise.all([
    resolveSafeTxErc20Bundle(chainId, inner),
    buildNameBundles(chainId, nameAddrs)
  ])
  return { erc20Bundle, cowOrderBundle: order?.cowOrderBundle, nameBundles }
}
