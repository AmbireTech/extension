/**
 * Messages between the background and the Privacy Pools prover's offscreen document.
 *
 * Proving inputs hold a note's secret and nullifier (enough to spend it), so they go only from the
 * background over a dedicated port checked by `isFromProverDocument` - never `runtime.sendMessage`,
 * which every extension page receives. Proofs and public signals coming back end up on chain anyway.
 */
import type { PrivacyPoolsProver } from '@ambire-common/libs/privacyPools/prover'

/** Name of the port the offscreen document opens to the background. */
export const PRIVACY_POOLS_PROVER_PORT_NAME = 'privacy-pools-prover'

/** The offscreen document's page, relative to the extension root. */
export const PRIVACY_POOLS_PROVER_DOCUMENT_PATH = 'privacy-pools-prover.html'

export type PrivacyPoolsCircuit = Parameters<PrivacyPoolsProver['prove']>[0]

type ProveResult = Awaited<ReturnType<PrivacyPoolsProver['prove']>>

/** Proving inputs with bigints as decimal strings - extension messaging is JSON. */
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
  /** Artifacts loaded and worker threads running. */
  | { type: 'ready' }
  /** Details are only in the document's console. */
  | { type: 'startup-failed' }
  | { type: 'proved'; id: number; proof: ProveResult['proof']; publicSignals: string[] }
  /** No message: one from the circuit could reveal the inputs. */
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

/** Encodes proving inputs for extension messaging - see `EncodedSignals`. */
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
 * Whether a port was opened by this extension's prover document.
 *
 * `onConnect` also fires for this extension's content scripts (inside websites), so the extension
 * id is not enough: the exact URL is checked and a sender with a tab (as content scripts always
 * have) is refused. Other extensions only reach `onConnectExternal`, which is not listened to.
 */
export const isFromProverDocument = (port: chrome.runtime.Port): boolean =>
  port.name === PRIVACY_POOLS_PROVER_PORT_NAME &&
  port.sender?.id === chrome.runtime.id &&
  !port.sender.tab &&
  port.sender.url === chrome.runtime.getURL(PRIVACY_POOLS_PROVER_DOCUMENT_PATH)
