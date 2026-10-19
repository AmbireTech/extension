// The addresses the device shows for a call, and the name bundles for the
// ones the names catalog knows.
//
// The device looks up a name for every address it would otherwise show raw:
// `to`, an ERC-20 transfer recipient / approve spender / transferFrom from
// and to, a Safe transaction's `to`, each MultiSendCallOnly record's target
// (and its ERC-20 arguments), and a CoW order's receiver. Ambire attaches a
// bundle for each it can, deduplicated, up to `MAX_NAME_BUNDLES` per
// request. An address without one is shown raw.

import { MAX_NAME_BUNDLES } from '../config'
import { reportClearSigningFallback } from '../db/common'
import type { SafeTxInnerCall } from '../erc20/detect'
import {
  ERC20_APPROVE_SELECTOR,
  ERC20_TRANSFER_FROM_SELECTOR,
  ERC20_TRANSFER_SELECTOR
} from '../erc20/selectors'
import { decodeExecTransaction, isSafeExecTransaction } from '../safe/execCalldata'
import { summarizeMultiSend } from '../safe/multiSend'
import { bytesToHex, hexToBytes, readAddressWord, selectorMatches } from '../transport/bytes'
import { loadNamesDb } from './db'

/** The `address` argument in ABI word `wordIdx` after the selector. */
const addressArg = (data: Uint8Array, wordIdx: number) => readAddressWord(data, 4 + wordIdx * 32)

/** ERC-20 recipient/spender/from addresses carried in transfer-style
 *  calldata (the arguments the device labels). */
function erc20ArgAddresses(data: Uint8Array): Uint8Array[] {
  const out: Uint8Array[] = []
  if (data.length < 4) return out
  if (
    selectorMatches(data, ERC20_TRANSFER_SELECTOR) ||
    selectorMatches(data, ERC20_APPROVE_SELECTOR)
  ) {
    const a = addressArg(data, 0)
    if (a) out.push(a)
  } else if (selectorMatches(data, ERC20_TRANSFER_FROM_SELECTOR)) {
    const from = addressArg(data, 0)
    const to = addressArg(data, 1)
    if (from) out.push(from)
    if (to) out.push(to)
  }
  return out
}

/** The addresses the device shows for a Safe transaction: its `to` and
 *  ERC-20 args (operation 0), or each MultiSendCallOnly record target plus
 *  that record's ERC-20 args (operation 1). */
export function collectSafeTxDisplayAddresses(inner: SafeTxInnerCall): Uint8Array[] {
  if (inner.operation === 0) {
    return [hexToBytes(inner.to), ...erc20ArgAddresses(inner.data)]
  }
  const summary = summarizeMultiSend(inner.data)
  if (typeof summary === 'string') return []
  return summary.records.flatMap((rec) => [hexToBytes(rec.to), ...erc20ArgAddresses(rec.data)])
}

/** Every address the device will show for this call: the call `to`, its
 *  ERC-20 args, and — for a Safe execTransaction — the Safe transaction's
 *  `to` / each multiSend record target plus their ERC-20 args. CoW
 *  receivers and an approveHash's Safe transaction are added by the caller
 *  (they come from fetched data, not the calldata). Returned as raw 20-byte
 *  addresses; `buildNameBundles` dedupes them. */
export function collectDisplayAddresses(to: `0x${string}`, data: Uint8Array): Uint8Array[] {
  const out: Uint8Array[] = [hexToBytes(to), ...erc20ArgAddresses(data)]
  if (!isSafeExecTransaction(data)) return out
  const exec = decodeExecTransaction(data)
  return exec ? [...out, ...collectSafeTxDisplayAddresses(exec)] : out
}

const ZERO_ADDRESS_KEY = '0'.repeat(40)

/** Up to `MAX_NAME_BUNDLES` name bundles for `addresses` on `chainId`,
 *  deduped by address, skipping the zero address. Never throws — a catalog
 *  failure or a miss just yields fewer (or no) bundles, and the device shows
 *  those addresses raw. */
export async function buildNameBundles(
  chainId: number | bigint,
  addresses: Uint8Array[]
): Promise<Uint8Array[]> {
  if (addresses.length === 0) return []
  let db
  try {
    db = await loadNamesDb()
  } catch (e) {
    reportClearSigningFallback('names DB load failed; addresses render as hex', e)
    return []
  }

  const bundles: Uint8Array[] = []
  const seen = new Set<string>()
  for (const addr of addresses) {
    if (bundles.length >= MAX_NAME_BUNDLES) break
    if (addr.length !== 20) continue
    const key = bytesToHex(addr)
    if (key === ZERO_ADDRESS_KEY || seen.has(key)) continue
    seen.add(key)
    try {
      const bundle = db.buildBundle(chainId, addr)
      if (bundle) bundles.push(bundle)
    } catch (e) {
      reportClearSigningFallback(`name bundle build failed for ${key}; address renders as hex`, e)
    }
  }
  return bundles
}
