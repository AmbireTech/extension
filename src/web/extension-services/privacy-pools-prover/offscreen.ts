/**
 * The Privacy Pools prover's offscreen document (Chrome only). A service worker has no `Worker`,
 * so ffjavascript proves on one thread there; here it uses every core. Its threads start from a
 * `blob:` URL, which `script-src 'self'` allows when the extension created it. The pools' Merkle
 * trees are hashed here on every core too, by workers started from the extension's own file.
 *
 * It handles the most sensitive inputs after the keys, so it is minimal: no UI, no Sentry, no
 * storage, no network beyond its artifacts, bundled under LavaMoat, logs only to its own console.
 */
import { parallelLevels } from '@kohaku-eth/poseidon-lean-imt'
import { curves } from 'snarkjs'

import { createProverFactory } from '@ambire-common/libs/privacyPools/prover'

import {
  BuildTreeRequest,
  decodeSignals,
  decodeTreeLeaves,
  encodeTreeNodes,
  isPrivacyPoolsCircuit,
  PRIVACY_POOLS_PROVER_PORT_NAME,
  PRIVACY_POOLS_TREE_WORKER_PATH,
  ProveRequest,
  ProverMessage,
  ProverRequest
} from './protocol'

/** Past this many workers, starting them and passing the levels outweigh the extra cores. */
const MAX_TREE_WORKERS = 16
const FALLBACK_CORE_COUNT = 4

const TREE_WORKERS = Math.min(
  navigator.hardwareConcurrency || FALLBACK_CORE_COUNT,
  MAX_TREE_WORKERS
)
const TREE_WORKER_URL = chrome.runtime.getURL(PRIVACY_POOLS_TREE_WORKER_PATH)

const getProver = createProverFactory(chrome.runtime.getURL('privacy-pools-circuits/'))

const port = chrome.runtime.connect({ name: PRIVACY_POOLS_PROVER_PORT_NAME })
let isConnected = true

const send = (message: ProverMessage) => {
  // The background may close the document while a proof is running
  if (isConnected) port.postMessage(message)
}

/** Time for the prover to load the artifacts and start its threads. */
const PROVER_STARTUP_TIMEOUT_MS = 30 * 1000

let readyProver: ReturnType<typeof getProver> | null = null

const startProver = async () => {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error('privacyPools: the prover took too long to start')),
      PROVER_STARTUP_TIMEOUT_MS
    )
  })

  try {
    return await Promise.race([curves.getCurveFromName('bn128').then(() => getProver()), timedOut])
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Loads the artifacts and builds the curve (which starts the worker threads) on the first proof,
 * not when the document opens, as most openings only build trees. Broken or stuck workers fail
 * here, before any input is used, so the background proves in its own context instead.
 */
const getReadyProver = () => {
  if (!readyProver) readyProver = startProver()

  return readyProver
}

const prove = async (request: ProveRequest) => {
  let prover: Awaited<ReturnType<typeof getProver>>
  try {
    prover = await getReadyProver()
  } catch (error) {
    console.error('privacyPools: the prover could not start', error)
    send({ type: 'prover-unavailable', id: request.id })
    return
  }

  try {
    if (!isPrivacyPoolsCircuit(request.circuit))
      throw new Error('privacyPools: a proof was asked for an unknown circuit')

    const { proof, publicSignals } = await prover.prove(
      request.circuit,
      // Encoded by `encodeSignals` from the SDK's inputs for this circuit
      decodeSignals(request.signals) as Parameters<typeof prover.prove>[1]
    )

    send({ type: 'proved', id: request.id, proof, publicSignals })
  } catch (error) {
    // Logged here only: a circuit error can reveal the inputs
    console.error('privacyPools: a proof could not be generated', error)
    send({ type: 'prove-failed', id: request.id })
  }
}

const buildTree = async (request: BuildTreeRequest) => {
  try {
    const levels = await parallelLevels(
      decodeTreeLeaves(request.leaves),
      TREE_WORKERS,
      TREE_WORKER_URL
    )

    send({ type: 'tree-built', id: request.id, levels: levels.map(encodeTreeNodes) })
  } catch (error) {
    console.error('privacyPools: a tree could not be built', error)
    send({ type: 'build-tree-failed', id: request.id })
  }
}

/** One tree at a time: each build already starts a worker per core. */
let treeQueue: Promise<void> = Promise.resolve()

const handleRequest = (message: ProverRequest) => {
  if (message.type === 'prove') return prove(message)

  treeQueue = treeQueue.then(() => buildTree(message))
  return treeQueue
}

const isProverRequest = (message: unknown): message is ProverRequest => {
  const request = message as ProverRequest | null
  return (
    (request?.type === 'prove' || request?.type === 'build-tree') && typeof request.id === 'number'
  )
}

port.onMessage.addListener((message: unknown) => {
  if (!isProverRequest(message)) {
    console.error('privacyPools: the prover document received an unexpected message')
    return
  }

  handleRequest(message).catch((error) => {
    console.error('privacyPools: a request could not be answered', error)
  })
})

// The background never reopens a port, so once it is gone this document is useless
port.onDisconnect.addListener(() => {
  isConnected = false
  window.close()
})

send({ type: 'ready' })
