import {
  CircuitName,
  CircuitPublicSignalsMap,
  CommitmentSignalMapper,
  WithdrawSignalMapper
} from '@fatsolutions/privacy-pools-core-circuits'
import { PoseidonT3LeanIMT } from '@kohaku-eth/poseidon-lean-imt'
import { buildMerkleTree, MerkleTreeBuilder } from '@kohaku-eth/privacy-pools'

import { PRIVACY_POOLS_PROOF_CANCELLED_MESSAGE } from '@ambire-common/libs/privacyPools/prover'
import type {
  PrivacyPoolsProver,
  PrivacyPoolsProverFactory
} from '@ambire-common/libs/privacyPools/prover'

import {
  decodeTreeLevels,
  encodeSignals,
  encodeTreeNodes,
  isFromProverDocument,
  isProverReply,
  PRIVACY_POOLS_PROVER_DOCUMENT_PATH,
  PRIVACY_POOLS_PROVER_PORT_NAME,
  ProverMessage,
  ProverReply,
  ProverRequest
} from './protocol'

/** Time for the document to load and connect. */
const STARTUP_TIMEOUT_MS = 30 * 1000

/**
 * A proof taking longer is taken as stuck (a worker that died mid-task never answers). Several
 * times a single-thread proof, so a slow machine is not cut off.
 */
const PROOF_TIMEOUT_MS = 3 * 60 * 1000

/**
 * A tree taking longer is built in the background instead. Several times the slowest single-thread
 * build, so a slow machine is not cut off.
 */
const TREE_TIMEOUT_MS = 60 * 1000

/**
 * Smaller trees are built in the background: below it the round trip to the document costs more
 * than it saves. The SDK's own threshold for starting workers.
 */
const OFFSCREEN_TREE_MIN_LEAVES = 2048

/** Idle time before closing the document. Covers the gaps between the proofs of one withdrawal. */
const IDLE_CLOSE_MS = 2 * 60 * 1000

const DOCUMENT_STOPPED_MESSAGE = 'privacyPools: the proof generator stopped before finishing'

// Not in this version of `@types/chrome`
const WORKERS_REASON = 'WORKERS' as chrome.offscreen.Reason
type ChromeRuntimeWithContexts = typeof chrome.runtime & {
  getContexts?: (filter: { contextTypes: string[]; documentUrls: string[] }) => Promise<unknown[]>
}

type PendingRequest = {
  port: chrome.runtime.Port
  resolve: (message: ProverReply) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

type RequestOptions = {
  timeoutMs: number
  /** Whether a request that times out closes the document, as one likely stuck. */
  closesOnTimeout: boolean
  timeoutMessage: string
  signal?: AbortSignal
}

const SIGNAL_MAPPERS = {
  withdraw: WithdrawSignalMapper,
  commitment: CommitmentSignalMapper
} as const

const mapPublicSignals = <C extends CircuitName>(circuit: C, publicSignals: string[]) =>
  // TypeScript cannot narrow the mapper's return type through the lookup
  SIGNAL_MAPPERS[circuit](publicSignals) as CircuitPublicSignalsMap[C]

/** Whether the browser supports offscreen documents (Chrome, not Firefox or Safari). */
export const canUseOffscreenProver = () =>
  typeof chrome !== 'undefined' && typeof chrome.offscreen?.createDocument === 'function'

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)))

/**
 * Proves and builds the pools' Merkle trees in an offscreen document on every core, instead of the
 * service worker's single thread. The document opens on the first proof or large tree and closes
 * when idle. If it fails to open or start, all later work stays in the background and `onError` is
 * called once: proofs use `fallback` (the in-process prover), trees the SDK's own builder. If only
 * the prover fails to start in it, only proofs stay in the background. A proof whose signal aborts
 * fails at once and closes the document, stopping its threads.
 *
 * Proving inputs are sent only to a port the document opened (`isFromProverDocument`); any other
 * port connecting under its name is disconnected.
 *
 * The SDK caches its trees per builder, so `merkleTreeBuilder` must be passed as it is, never
 * wrapped anew per plugin.
 */
export const createOffscreenPrivacyPools = ({
  fallback,
  onError
}: {
  fallback: PrivacyPoolsProverFactory
  onError: (error: Error) => void
}): { proverFactory: PrivacyPoolsProverFactory; merkleTreeBuilder: MerkleTreeBuilder } => {
  const documentUrl = chrome.runtime.getURL(PRIVACY_POOLS_PROVER_DOCUMENT_PATH)
  const pendingRequests = new Map<number, PendingRequest>()
  let nextRequestId = 0
  let connection: Promise<chrome.runtime.Port> | null = null
  let activePort: chrome.runtime.Port | null = null
  let closing: Promise<void> = Promise.resolve()
  let idleTimeout: ReturnType<typeof setTimeout> | null = null
  /** The document could not open or start: nothing is sent to it any more. */
  let isUnavailable = false
  /** The document works, but its prover could not start: only trees are sent to it. */
  let isProverUnavailable = false
  /** Whether this background created a document and has not closed it. */
  let isDocumentOpen = false
  /** Set only while a document is starting, to receive the port it opens. */
  let acceptPort: ((port: chrome.runtime.Port) => void) | null = null

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== PRIVACY_POOLS_PROVER_PORT_NAME) return
    if (!isFromProverDocument(port) || !acceptPort) {
      port.disconnect()
      return
    }

    acceptPort(port)
  })

  const clearIdleTimeout = () => {
    if (!idleTimeout) return
    clearTimeout(idleTimeout)
    idleTimeout = null
  }

  /** Whether a document is open, including one left over from before a restart. */
  const hasDocument = async () => {
    const runtime: ChromeRuntimeWithContexts = chrome.runtime
    // Chrome 116+. Before it, a leftover document makes `createDocument` fail, which falls back.
    if (!runtime.getContexts) return isDocumentOpen

    const contexts = await runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [documentUrl]
    })
    return contexts.length > 0
  }

  const closeDocument = () => {
    connection = null
    activePort = null
    clearIdleTimeout()
    closing = closing
      .then(async () => {
        if (await hasDocument()) await chrome.offscreen.closeDocument()
        isDocumentOpen = false
      })
      .catch((error) => {
        console.error('privacyPools: the prover document could not be closed', error)
        onError(error)
      })

    return closing
  }

  const scheduleIdleClose = () => {
    if (pendingRequests.size) return

    clearIdleTimeout()
    idleTimeout = setTimeout(() => {
      idleTimeout = null
      closeDocument().catch((error) => console.error(error))
    }, IDLE_CLOSE_MS)
  }

  const rejectPendingRequests = (port: chrome.runtime.Port, error: Error) => {
    pendingRequests.forEach((pending, id) => {
      if (pending.port !== port) return

      clearTimeout(pending.timeout)
      pendingRequests.delete(id)
      pending.reject(error)
    })
  }

  const listenForReplies = (port: chrome.runtime.Port) => {
    port.onMessage.addListener((message: unknown) => {
      if (!isProverReply(message)) return

      const pending = pendingRequests.get(message.id)
      if (!pending || pending.port !== port) return

      clearTimeout(pending.timeout)
      pendingRequests.delete(message.id)
      pending.resolve(message)

      scheduleIdleClose()
    })

    port.onDisconnect.addListener(() => {
      rejectPendingRequests(port, new Error(DOCUMENT_STOPPED_MESSAGE))
      // A document closed for being idle is replaced by the time its port reports it
      if (activePort !== port) return

      activePort = null
      connection = null
      clearIdleTimeout()
    })
  }

  /** Resolves with the document's port once it reports ready. */
  const waitForReadyDocument = () => {
    let cancel: (error: Error) => void = () => {}

    const promise = new Promise<chrome.runtime.Port>((resolve, reject) => {
      let connectedPort: chrome.runtime.Port | null = null
      let isSettled = false

      const onMessage = (message: ProverMessage) => {
        if (message?.type === 'ready') settle(null)
      }
      const onDisconnect = () => {
        settle(new Error('privacyPools: the proof generator closed while starting'))
      }
      const timeout = setTimeout(() => {
        settle(new Error('privacyPools: the proof generator took too long to start'))
      }, STARTUP_TIMEOUT_MS)

      function settle(error: Error | null) {
        if (isSettled) return
        isSettled = true
        clearTimeout(timeout)
        acceptPort = null
        connectedPort?.onMessage.removeListener(onMessage)
        connectedPort?.onDisconnect.removeListener(onDisconnect)

        if (!error && connectedPort) {
          resolve(connectedPort)
          return
        }

        reject(error ?? new Error('privacyPools: the proof generator reported ready unconnected'))
      }

      acceptPort = (port) => {
        // Only the first port of a document is ever used
        if (connectedPort) {
          port.disconnect()
          return
        }

        connectedPort = port
        port.onMessage.addListener(onMessage)
        port.onDisconnect.addListener(onDisconnect)
      }
      cancel = settle
    })

    return { promise, cancel }
  }

  const openDocument = async () => {
    await closing
    // A document left over from before the service worker restarted has lost its port, and Chrome
    // allows only one offscreen document at a time
    if (await hasDocument()) await chrome.offscreen.closeDocument()

    const readyDocument = waitForReadyDocument()
    try {
      await chrome.offscreen.createDocument({
        url: PRIVACY_POOLS_PROVER_DOCUMENT_PATH,
        reasons: [WORKERS_REASON],
        justification:
          'Generates Privacy Pools withdrawal proofs and builds their Merkle trees on several threads.'
      })
      isDocumentOpen = true
    } catch (error: any) {
      readyDocument.cancel(toError(error))
    }

    const port = await readyDocument.promise
    activePort = port
    listenForReplies(port)

    return port
  }

  const getConnection = () => {
    if (!connection) {
      connection = openDocument().catch(async (error) => {
        await closeDocument()
        throw error
      })
    }

    return connection
  }

  /** Opens the document if needed; marks it unavailable for good if it cannot. */
  const connect = async (): Promise<chrome.runtime.Port | null> => {
    clearIdleTimeout()
    try {
      return await getConnection()
    } catch (error: any) {
      isUnavailable = true
      console.error('privacyPools: proving and building trees in this context instead', error)
      onError(toError(error))
      return null
    }
  }

  const sendRequest = (
    port: chrome.runtime.Port,
    request: ProverRequest,
    { timeoutMs, closesOnTimeout, timeoutMessage, signal }: RequestOptions
  ) =>
    new Promise<ProverReply>((resolve, reject) => {
      // Cancelled while the document was starting: nothing else will close it
      if (signal?.aborted) {
        reject(new Error(PRIVACY_POOLS_PROOF_CANCELLED_MESSAGE))
        scheduleIdleClose()
        return
      }

      const onAbort = () => {
        const pending = pendingRequests.get(request.id)
        if (!pending) return

        clearTimeout(pending.timeout)
        pendingRequests.delete(request.id)
        pending.reject(new Error(PRIVACY_POOLS_PROOF_CANCELLED_MESSAGE))
        // The worker threads cannot drop a proof midway, so the document goes with them. Only one
        // withdrawal proves at a time, so no other operation's proof goes with it. Trees being
        // built go with it too, and are built in the background instead.
        closeDocument().catch((error) => console.error(error))
      }
      const stopListening = () => signal?.removeEventListener('abort', onAbort)

      const timeout = setTimeout(() => {
        pendingRequests.delete(request.id)
        stopListening()
        reject(new Error(timeoutMessage))
        // Likely stuck, so the next request starts from a fresh document
        if (closesOnTimeout) closeDocument().catch((error) => console.error(error))
        else scheduleIdleClose()
      }, timeoutMs)

      signal?.addEventListener('abort', onAbort, { once: true })
      pendingRequests.set(request.id, {
        port,
        resolve: (message) => {
          stopListening()
          resolve(message)
        },
        reject: (error) => {
          stopListening()
          reject(error)
        },
        timeout
      })
      port.postMessage(request)
    })

  const proveWithFallback: PrivacyPoolsProver['prove'] = async (circuit, signals) => {
    const prover = await fallback()

    return prover.prove(circuit, signals)
  }

  // The fallback cannot stop midway, so it gets no signal - see `withCancellableProving`
  const prove: PrivacyPoolsProver['prove'] = async (circuit, signals, options) => {
    if (isUnavailable || isProverUnavailable) return proveWithFallback(circuit, signals)

    const port = await connect()
    if (!port) return proveWithFallback(circuit, signals)

    nextRequestId += 1
    const reply = await sendRequest(
      port,
      { type: 'prove', id: nextRequestId, circuit, signals: encodeSignals(signals) },
      {
        timeoutMs: PROOF_TIMEOUT_MS,
        closesOnTimeout: true,
        timeoutMessage: 'privacyPools: generating the proof took too long',
        signal: options?.signal
      }
    )
    if (reply.type === 'prover-unavailable') {
      isProverUnavailable = true
      const error = new Error('privacyPools: the prover document could not start its prover')
      console.error(error)
      onError(error)

      return proveWithFallback(circuit, signals)
    }
    if (reply.type !== 'proved') throw new Error('privacyPools: the proof could not be generated')

    const { proof, publicSignals } = reply
    return { proof, publicSignals, mappedSignals: mapPublicSignals(circuit, publicSignals) }
  }

  const prover: PrivacyPoolsProver = { prove }

  const buildTreeInDocument = async (port: chrome.runtime.Port, leaves: bigint[]) => {
    nextRequestId += 1
    const reply = await sendRequest(
      port,
      { type: 'build-tree', id: nextRequestId, leaves: encodeTreeNodes(leaves) },
      {
        timeoutMs: TREE_TIMEOUT_MS,
        // A proof may be running in the same document
        closesOnTimeout: false,
        timeoutMessage: 'privacyPools: building the tree took too long'
      }
    )
    if (reply.type !== 'tree-built') throw new Error('privacyPools: the tree could not be built')

    return PoseidonT3LeanIMT.fromLevels(decodeTreeLevels(reply.levels, leaves))
  }

  const merkleTreeBuilder: MerkleTreeBuilder = async (leaves) => {
    if (isUnavailable || leaves.length < OFFSCREEN_TREE_MIN_LEAVES) return buildMerkleTree(leaves)

    const port = await connect()
    if (!port) return buildMerkleTree(leaves)

    try {
      return await buildTreeInDocument(port, leaves)
    } catch (error: any) {
      console.error('privacyPools: building the tree in this context instead', error)
      // A cancelled proof closing the document is expected, not a failure
      if (error?.message !== DOCUMENT_STOPPED_MESSAGE) onError(toError(error))

      return buildMerkleTree(leaves)
    }
  }

  return { proverFactory: async () => prover, merkleTreeBuilder }
}
