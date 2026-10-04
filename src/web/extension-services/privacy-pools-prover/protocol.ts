/**
 * The messages between the background and the Privacy Pools prover's offscreen document.
 *
 * Proving inputs carry a note's secret and nullifier - enough to spend it - so they only ever
 * travel over a dedicated port between those two contexts, never `runtime.sendMessage`, which every
 * extension page receives. They only go one way, from the background, and only once it has checked
 * the port was opened by the offscreen document (`isFromProverDocument`). What comes back - proofs
 * and their public signals - ends up on chain anyway.
 */
import type { PrivacyPoolsProver } from '@ambire-common/libs/privacyPools/prover'

/** The name of the one port the offscreen document opens to the background. */
export const PRIVACY_POOLS_PROVER_PORT_NAME = 'privacy-pools-prover'

/** The offscreen document's page, relative to the extension root. */
export const PRIVACY_POOLS_PROVER_DOCUMENT_PATH = 'privacy-pools-prover.html'

export type PrivacyPoolsCircuit = Parameters<PrivacyPoolsProver['prove']>[0]

type ProveResult = Awaited<ReturnType<PrivacyPoolsProver['prove']>>

/**
 * Proving inputs with every bigint as a decimal string: extension messaging serializes as JSON,
 * which has no bigint.
 */
export type EncodedSignals = Record<string, string | string[]>

/** Background → offscreen document. */
export type ProveRequest = {
  type: 'prove'
  id: number
  circuit: PrivacyPoolsCircuit
  signals: EncodedSignals
}

/** Offscreen document → background. */
export type ProverMessage =
  /** Artifacts loaded and worker threads running: proofs can be asked for. */
  | { type: 'ready' }
  /** The document could not get ready. Nothing more about why: its own console has the details. */
  | { type: 'startup-failed' }
  | { type: 'proved'; id: number; proof: ProveResult['proof']; publicSignals: string[] }
  /** Carries no message: one from the circuit could describe the inputs. */
  | { type: 'prove-failed'; id: number }

const CIRCUITS: readonly PrivacyPoolsCircuit[] = ['withdraw', 'commitment']

export const isPrivacyPoolsCircuit = (value: unknown): value is PrivacyPoolsCircuit =>
  CIRCUITS.includes(value as PrivacyPoolsCircuit)

const encodeSignal = (value: unknown): string | string[] => {
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value) && value.every((item) => typeof item === 'bigint'))
    return value.map((item) => item.toString())

  throw new Error('privacyPools: a proving input is neither a number nor a list of numbers')
}

/** Turns proving inputs into something extension messaging can carry - see `EncodedSignals`. */
export const encodeSignals = (signals: object): EncodedSignals =>
  Object.fromEntries(Object.entries(signals).map(([name, value]) => [name, encodeSignal(value)]))

const decodeSignal = (value: unknown): bigint | bigint[] => {
  if (typeof value === 'string') return BigInt(value)
  if (Array.isArray(value) && value.every((item) => typeof item === 'string'))
    return value.map((item) => BigInt(item))

  throw new Error('privacyPools: a proving input arrived in an unexpected form')
}

/** The inverse of `encodeSignals`. Throws on anything it did not produce. */
export const decodeSignals = (signals: unknown): Record<string, bigint | bigint[]> => {
  if (!signals || typeof signals !== 'object' || Array.isArray(signals))
    throw new Error('privacyPools: the proving inputs arrived in an unexpected form')

  return Object.fromEntries(
    Object.entries(signals).map(([name, value]) => [name, decodeSignal(value)])
  )
}

/**
 * Whether a port was opened by this extension's own prover document.
 *
 * `onConnect` also fires for this extension's content scripts, which run inside websites, so the
 * extension id alone is not enough: the exact URL is checked too, and a sender with a tab - which
 * a content script always has - is refused. Other extensions only ever reach `onConnectExternal`,
 * which nothing here listens to.
 */
export const isFromProverDocument = (port: chrome.runtime.Port): boolean =>
  port.name === PRIVACY_POOLS_PROVER_PORT_NAME &&
  port.sender?.id === chrome.runtime.id &&
  !port.sender.tab &&
  port.sender.url === chrome.runtime.getURL(PRIVACY_POOLS_PROVER_DOCUMENT_PATH)
