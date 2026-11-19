/**
 * Messages between the background and the Privacy Pools prover's offscreen document, which proves
 * withdrawals and builds the pools' Merkle trees.
 *
 * Proving inputs hold a note's secret and nullifier (enough to spend it), so they go only from the
 * background over a dedicated port checked by `isFromProverDocument` - never `runtime.sendMessage`,
 * which every extension page receives. Proofs and public signals coming back end up on chain anyway.
 * Tree leaves are public: every pool's deposits and every approved label are read from the chain.
 */
import type { PrivacyPoolsProver } from '@ambire-common/libs/privacyPools/prover'

/** Name of the port the offscreen document opens to the background. */
export const PRIVACY_POOLS_PROVER_PORT_NAME = 'privacy-pools-prover'

/** The offscreen document's page, relative to the extension root. */
export const PRIVACY_POOLS_PROVER_DOCUMENT_PATH = 'privacy-pools-prover.html'

/**
 * The worker that hashes a slice of a tree level, relative to the extension root. A webpack entry
 * of its own (see webpack/extension.js): the worker webpack emits for the package's
 * `new Worker(new URL(...))` loads its code with `importScripts`, which a module worker lacks.
 */
export const PRIVACY_POOLS_TREE_WORKER_PATH = 'privacy-pools-tree-worker.js'

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

/** Background → offscreen document: all levels of the tree over `leaves`, from the leaves up. */
export type BuildTreeRequest = {
  type: 'build-tree'
  id: number
  /** Decimal strings - extension messaging is JSON. */
  leaves: string[]
}

export type ProverRequest = ProveRequest | BuildTreeRequest

/** Offscreen document → background. */
export type ProverMessage =
  /** Listening. The prover loads its artifacts and starts its threads on the first proof. */
  | { type: 'ready' }
  | { type: 'proved'; id: number; proof: ProveResult['proof']; publicSignals: string[] }
  /** No message: one from the circuit could reveal the inputs. */
  | { type: 'prove-failed'; id: number }
  /** The artifacts or the threads failed to load, so no proof can be made here. */
  | { type: 'prover-unavailable'; id: number }
  /** Decimal strings, the leaves first and the root last. */
  | { type: 'tree-built'; id: number; levels: string[][] }
  /** Details are only in the document's console. */
  | { type: 'build-tree-failed'; id: number }

/** A message answering the request with `id`. */
export type ProverReply = Exclude<ProverMessage, { type: 'ready' }>

const REPLY_TYPES: readonly ProverReply['type'][] = [
  'proved',
  'prove-failed',
  'prover-unavailable',
  'tree-built',
  'build-tree-failed'
]

export const isProverReply = (message: unknown): message is ProverReply =>
  !!message &&
  typeof message === 'object' &&
  REPLY_TYPES.includes((message as ProverReply).type) &&
  typeof (message as ProverReply).id === 'number'

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

/** Encodes tree leaves or levels for extension messaging. */
export const encodeTreeNodes = (nodes: bigint[]): string[] => nodes.map((node) => node.toString())

const decodeTreeNodes = (nodes: unknown): bigint[] => {
  if (!Array.isArray(nodes) || !nodes.every((node) => typeof node === 'string'))
    throw new Error('privacyPools: tree nodes arrived in an unexpected form')

  return nodes.map((node) => BigInt(node))
}

/** The inverse of `encodeTreeNodes`, for the leaves the document is asked to build a tree over. */
export const decodeTreeLeaves = (leaves: unknown): bigint[] => decodeTreeNodes(leaves)

const isSameLevel = (level: bigint[], nodes: bigint[]) =>
  level.length === nodes.length && level.every((node, i) => node === nodes[i])

/**
 * Decodes the levels the document built over `leaves`, refusing any that are not shaped like
 * that tree: the leaves themselves first, each level half the one below (rounded up), one root.
 * The hashes are not checked, as that is the work the document saves: a wrong one only makes a
 * root the pool never had, which the SDK refuses when it compares the roots with the chain.
 */
export const decodeTreeLevels = (levels: unknown, leaves: bigint[]): bigint[][] => {
  if (!Array.isArray(levels) || levels.length === 0)
    throw new Error('privacyPools: the tree levels arrived in an unexpected form')

  const decoded = levels.map(decodeTreeNodes)
  if (!isSameLevel(decoded[0]!, leaves))
    throw new Error('privacyPools: the tree was built over other leaves')

  const isHalvedEachLevel = decoded.every(
    (level, i) => i === 0 || level.length === Math.ceil(decoded[i - 1]!.length / 2)
  )
  if (!isHalvedEachLevel || decoded[decoded.length - 1]!.length !== 1)
    throw new Error('privacyPools: the tree levels are not shaped like a tree')

  return decoded
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
