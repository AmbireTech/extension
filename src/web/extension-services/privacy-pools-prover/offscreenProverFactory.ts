import {
  CircuitName,
  CircuitPublicSignalsMap,
  CommitmentSignalMapper,
  WithdrawSignalMapper
} from '@fatsolutions/privacy-pools-core-circuits'

import type {
  PrivacyPoolsProver,
  PrivacyPoolsProverFactory
} from '@ambire-common/libs/privacyPools/prover'

import {
  encodeSignals,
  isFromProverDocument,
  PRIVACY_POOLS_PROVER_DOCUMENT_PATH,
  PRIVACY_POOLS_PROVER_PORT_NAME,
  ProveRequest,
  ProverMessage
} from './protocol'

/** Time for the document to load the artifacts and start its threads. */
const STARTUP_TIMEOUT_MS = 30 * 1000

/**
 * A proof taking longer is taken as stuck (a worker that died mid-task never answers). Several
 * times a single-thread proof, so a slow machine is not cut off.
 */
const PROOF_TIMEOUT_MS = 3 * 60 * 1000

/** Idle time before closing the document. Covers the gaps between the proofs of one withdrawal. */
const IDLE_CLOSE_MS = 2 * 60 * 1000

// Not in this version of `@types/chrome`
const WORKERS_REASON = 'WORKERS' as chrome.offscreen.Reason
type ChromeRuntimeWithContexts = typeof chrome.runtime & {
  getContexts?: (filter: { contextTypes: string[]; documentUrls: string[] }) => Promise<unknown[]>
}

type ProvedMessage = Extract<ProverMessage, { type: 'proved' }>

type PendingProof = {
  port: chrome.runtime.Port
  resolve: (message: ProvedMessage) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
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

/**
 * Proves in an offscreen document on every core instead of the service worker's single thread.
 * The document opens on the first proof and closes when idle. If it fails to open or start, all
 * later proofs use `fallback` (the in-process prover) and `onError` is called once.
 *
 * Proving inputs are sent only to a port the document opened (`isFromProverDocument`); any other
 * port connecting under its name is disconnected.
 */
export const createOffscreenProverFactory = ({
  fallback,
  onError
}: {
  fallback: PrivacyPoolsProverFactory
  onError: (error: Error) => void
}): PrivacyPoolsProverFactory => {
  const documentUrl = chrome.runtime.getURL(PRIVACY_POOLS_PROVER_DOCUMENT_PATH)
  const pendingProofs = new Map<number, PendingProof>()
  let nextRequestId = 0
  let connection: Promise<chrome.runtime.Port> | null = null
  let activePort: chrome.runtime.Port | null = null
  let closing: Promise<void> = Promise.resolve()
  let idleTimeout: ReturnType<typeof setTimeout> | null = null
  let isUnavailable = false
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
    if (pendingProofs.size) return

    clearIdleTimeout()
    idleTimeout = setTimeout(() => {
      idleTimeout = null
      closeDocument().catch((error) => console.error(error))
    }, IDLE_CLOSE_MS)
  }

  const rejectPendingProofs = (port: chrome.runtime.Port, error: Error) => {
    pendingProofs.forEach((pending, id) => {
      if (pending.port !== port) return

      clearTimeout(pending.timeout)
      pendingProofs.delete(id)
      pending.reject(error)
    })
  }

  const listenForProofs = (port: chrome.runtime.Port) => {
    port.onMessage.addListener((message: ProverMessage) => {
      if (message?.type !== 'proved' && message?.type !== 'prove-failed') return

      const pending = pendingProofs.get(message.id)
      if (!pending || pending.port !== port) return

      clearTimeout(pending.timeout)
      pendingProofs.delete(message.id)
      if (message.type === 'proved') pending.resolve(message)
      else pending.reject(new Error('privacyPools: the proof could not be generated'))

      scheduleIdleClose()
    })

    port.onDisconnect.addListener(() => {
      rejectPendingProofs(
        port,
        new Error('privacyPools: the proof generator stopped before finishing')
      )
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
        if (message?.type === 'startup-failed')
          settle(new Error('privacyPools: the proof generator could not start'))
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
        justification: 'Generates Privacy Pools withdrawal proofs on several threads.'
      })
      isDocumentOpen = true
    } catch (error: any) {
      readyDocument.cancel(error instanceof Error ? error : new Error(String(error)))
    }

    const port = await readyDocument.promise
    activePort = port
    listenForProofs(port)

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

  const requestProof = (port: chrome.runtime.Port, request: ProveRequest) =>
    new Promise<ProvedMessage>((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingProofs.delete(request.id)
        reject(new Error('privacyPools: generating the proof took too long'))
        // Likely stuck, so the next proof starts from a fresh document
        closeDocument().catch((error) => console.error(error))
      }, PROOF_TIMEOUT_MS)

      pendingProofs.set(request.id, { port, resolve, reject, timeout })
      port.postMessage(request)
    })

  const proveWithFallback: PrivacyPoolsProver['prove'] = async (circuit, signals) => {
    const prover = await fallback()

    return prover.prove(circuit, signals)
  }

  const prove: PrivacyPoolsProver['prove'] = async (circuit, signals) => {
    if (isUnavailable) return proveWithFallback(circuit, signals)

    clearIdleTimeout()
    let port: chrome.runtime.Port
    try {
      port = await getConnection()
    } catch (error: any) {
      isUnavailable = true
      console.error('privacyPools: proving in this context instead of the prover document', error)
      onError(error instanceof Error ? error : new Error(String(error)))

      return proveWithFallback(circuit, signals)
    }

    nextRequestId += 1
    const { proof, publicSignals } = await requestProof(port, {
      type: 'prove',
      id: nextRequestId,
      circuit,
      signals: encodeSignals(signals)
    })

    return { proof, publicSignals, mappedSignals: mapPublicSignals(circuit, publicSignals) }
  }

  const prover: PrivacyPoolsProver = { prove }

  return async () => prover
}
