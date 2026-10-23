// Read an order from the CoW Protocol orderbook API, for the order bundle
// of a `setPreSignature` (see `orderBundle.ts`).

import { isAddress, isHex, keccak256, type Address } from 'viem'

import { fetchWithTimeout } from '@ambire-common/utils/fetch'

import { hexToBytes } from '../transport/bytes'
import { type BuyTokenBalance, type OrderKind, type SellTokenBalance } from './types'

/** The order fields the bundle is built from. */
export interface OrderDetail {
  owner: Address
  sellToken: Address
  buyToken: Address
  receiver: Address
  sellAmount: bigint
  buyAmount: bigint
  feeAmount: bigint
  validTo: number
  appData: Uint8Array
  kind: OrderKind
  partiallyFillable: boolean
  sellTokenBalance: SellTokenBalance
  buyTokenBalance: BuyTokenBalance
}

/** Orderbook API of each PQ1 network CoW Protocol runs on. */
const COW_API_BASE_URLS: Record<number, string> = {
  1: 'https://api.cow.fi/mainnet/api/v1',
  8453: 'https://api.cow.fi/base/api/v1'
}

const COW_API_TIMEOUT_MS = 15_000

/** Whether CoW Protocol runs on `chainId`. */
export function isCowswapSupportedChain(chainId: number): boolean {
  return chainId in COW_API_BASE_URLS
}

/** The order `uidHex` on `chainId`. Throws when the orderbook doesn't answer
 *  with a well-formed order. */
export async function fetchCowOrder(chainId: number, uidHex: string): Promise<OrderDetail> {
  const base = COW_API_BASE_URLS[chainId]
  if (!base) throw new Error(`CoW Protocol doesn't run on chain ${chainId}`)
  const url = `${base}/orders/${uidHex}`
  const resp = await fetchWithTimeout(fetch, url, {}, COW_API_TIMEOUT_MS)
  if (!resp.ok) throw new Error(`GET ${url}: HTTP ${resp.status}`)
  return parseOrderDetail(await resp.json())
}

function parseOrderDetail(json: unknown): OrderDetail {
  if (typeof json !== 'object' || json === null) throw new Error('order detail not an object')
  const o = json as Record<string, unknown>
  return {
    owner: parseAddress(o.owner, 'owner'),
    sellToken: parseAddress(o.sellToken, 'sellToken'),
    buyToken: parseAddress(o.buyToken, 'buyToken'),
    receiver: parseAddress(o.receiver, 'receiver'),
    sellAmount: parseU256(o.sellAmount, 'sellAmount'),
    buyAmount: parseU256(o.buyAmount, 'buyAmount'),
    feeAmount: parseU256(o.feeAmount, 'feeAmount'),
    validTo: parseUint(o.validTo, 'validTo'),
    appData: parseAppData(o.appData),
    kind: parseKind(o.kind),
    partiallyFillable: Boolean(o.partiallyFillable),
    sellTokenBalance: parseSellBalance(o.sellTokenBalance),
    buyTokenBalance: parseBuyBalance(o.buyTokenBalance)
  }
}

function parseAddress(v: unknown, name: string): Address {
  if (typeof v !== 'string' || !isAddress(v, { strict: false })) {
    throw new Error(`${name}: invalid address ${String(v).slice(0, 50)}`)
  }
  return v as Address
}

function parseU256(v: unknown, name: string): bigint {
  if (typeof v !== 'string') throw new Error(`${name}: expected string, got ${typeof v}`)
  try {
    return BigInt(v)
  } catch {
    throw new Error(`${name}: not a u256 string: ${v}`)
  }
}

function parseUint(v: unknown, name: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
    throw new Error(`${name}: not a uint`)
  }
  return v
}

function parseKind(v: unknown): OrderKind {
  if (v === 'sell' || v === 'buy') return v
  throw new Error(`kind: ${String(v)}`)
}

function parseSellBalance(v: unknown): SellTokenBalance {
  if (v === 'erc20' || v === 'external' || v === 'internal') return v
  if (v === undefined || v === null) return 'erc20'
  throw new Error(`sellTokenBalance: ${String(v)}`)
}

function parseBuyBalance(v: unknown): BuyTokenBalance {
  if (v === 'erc20' || v === 'internal') return v
  if (v === undefined || v === null) return 'erc20'
  throw new Error(`buyTokenBalance: ${String(v)}`)
}

/** The order's 32-byte app data: the hash the API returns, or the hash of
 *  the full app-data document when the API returns the document. */
function parseAppData(v: unknown): Uint8Array {
  if (typeof v !== 'string') throw new Error('appData: not a string')
  const trimmed = v.startsWith('0x') || v.startsWith('0X') ? v.slice(2) : v
  if (trimmed.length === 64 && isHex(`0x${trimmed}`, { strict: true })) {
    return hexToBytes(trimmed)
  }
  return hexToBytes(keccak256(new TextEncoder().encode(v)))
}
