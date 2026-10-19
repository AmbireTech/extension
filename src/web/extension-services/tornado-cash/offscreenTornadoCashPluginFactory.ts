import type {
  TornadoCashPlugin,
  TornadoCashPluginFactory,
  TornadoCashPluginHost
} from '@ambire-common/interfaces/tornadoCash'
import { TORNADO_CASH_PLUGIN_STOPPED_MESSAGE } from '@ambire-common/libs/tornadoCash/plugin'

import { closeOffscreenDocument, openOffscreenDocument } from '../offscreen/offscreenDocument'
import {
  decodeTornadoCashValue,
  encodeTornadoCashValue,
  FromTornadoCashDocument,
  isFromTornadoCashDocument,
  isTornadoCashProviderMethod,
  TORNADO_CASH_DOCUMENT_PATH,
  TORNADO_CASH_PORT_NAME,
  ToTornadoCashDocument,
  TornadoCashPluginMethod
} from './protocol'

/** Time for the document to load and connect. */
const STARTUP_TIMEOUT_MS = 30 * 1000

/**
 * A call taking longer is taken as stuck. A cold sync reads every pool's history (about 40 s on a
 * fast machine), and a withdrawal proves up to twice per note on the CPU.
 */
const CALL_TIMEOUTS_MS: Record<TornadoCashPluginMethod, number> = {
  sync: 10 * 60 * 1000,
  notes: 2 * 60 * 1000,
  prepareShield: 2 * 60 * 1000,
  prepareUnshield: 15 * 60 * 1000
}

type PendingCall = {
  resolve: (result: unknown) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

/** Whether the browser supports offscreen documents (Chrome, not Firefox or Safari). */
export const canUseOffscreenTornadoCash = () =>
  typeof chrome !== 'undefined' && typeof chrome.offscreen?.createDocument === 'function'

/**
 * Runs each Tornado Cash plugin in an offscreen document, one at a time: starting a plugin stops
 * the previous one, as the SDK cannot stop its workers otherwise. The document asks back for RPC
 * calls and note keys, which the background serves from `host` - see `./protocol.ts`.
 *
 * A plugin whose document closes (for the Privacy Pools prover, or by the browser) fails every
 * call with `TORNADO_CASH_PLUGIN_STOPPED_MESSAGE`; the caller starts a new one.
 */
export const createOffscreenTornadoCashPluginFactory = ({
  onError
}: {
  onError: (error: Error) => void
}): TornadoCashPluginFactory => {
  const documentUrl = chrome.runtime.getURL(TORNADO_CASH_DOCUMENT_PATH)
  /** Set only while a document is starting, to receive the port it opens. */
  let acceptPort: ((port: chrome.runtime.Port) => void) | null = null
  let stopCurrent: (() => Promise<void>) | null = null

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== TORNADO_CASH_PORT_NAME) return
    if (!isFromTornadoCashDocument(port) || !acceptPort) {
      port.disconnect()
      return
    }

    acceptPort(port)
  })

  /** Resolves with the document's port once it reports ready; `cancel` rejects it at once. */
  const waitForReadyDocument = () => {
    let cancel: (error: Error) => void = () => {}

    const promise = new Promise<chrome.runtime.Port>((resolve, reject) => {
      let connectedPort: chrome.runtime.Port | null = null
      let isSettled = false

      const onMessage = (message: FromTornadoCashDocument) => {
        if (message?.type === 'ready') settle(null)
      }
      const onDisconnect = () =>
        settle(new Error('tornadoCash: the document closed while starting'))
      const timeout = setTimeout(
        () => settle(new Error('tornadoCash: the document took too long to start')),
        STARTUP_TIMEOUT_MS
      )

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

        reject(error ?? new Error('tornadoCash: the document reported ready unconnected'))
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

  const closeOwnDocument = async () => {
    try {
      await closeOffscreenDocument(documentUrl)
    } catch (error: any) {
      console.error('tornadoCash: the document could not be closed', error)
      onError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  const answerHost = async (
    port: chrome.runtime.Port,
    host: TornadoCashPluginHost,
    message: Extract<FromTornadoCashDocument, { type: 'provider' | 'derive-key' }>
  ) => {
    const reply = (response: ToTornadoCashDocument) => port.postMessage(response)
    try {
      let result: unknown
      if (message.type === 'derive-key') {
        // The keystore checks the path - see `KeystoreController.derivePrivacyKey`
        result = await host.deriveKey(message.path)
      } else {
        if (!isTornadoCashProviderMethod(message.method))
          throw new Error('tornadoCash: the document asked for an unknown provider method')

        const args = decodeTornadoCashValue(message.args)
        if (!Array.isArray(args)) throw new Error('tornadoCash: provider arguments are not a list')

        const method = host.provider[message.method] as (...params: unknown[]) => Promise<unknown>
        result = await method.apply(host.provider, args)
      }

      reply({ type: 'host-result', id: message.id, result: encodeTornadoCashValue(result) })
    } catch (error: any) {
      // Not passed on: the document only needs to know it failed
      console.error(`tornadoCash: the background could not answer ${message.type}`, error)
      reply({ type: 'host-failed', id: message.id })
    }
  }

  const startPlugin = async (host: TornadoCashPluginHost): Promise<TornadoCashPlugin> => {
    const readyDocument = waitForReadyDocument()
    try {
      // Closes any open document first, the Privacy Pools prover's included
      await openOffscreenDocument({
        path: TORNADO_CASH_DOCUMENT_PATH,
        justification: 'Runs the Tornado Cash SDK, which syncs and proves in Web Workers.'
      })
    } catch (error: any) {
      readyDocument.cancel(error instanceof Error ? error : new Error(String(error)))
    }

    let port: chrome.runtime.Port
    try {
      port = await readyDocument.promise
    } catch (error: any) {
      await closeOwnDocument()
      onError(error)
      throw error
    }

    const pendingCalls = new Map<number, PendingCall>()
    let nextCallId = 0
    let isStopped = false

    const rejectAll = (error: Error) => {
      pendingCalls.forEach(({ reject, timeout }) => {
        clearTimeout(timeout)
        reject(error)
      })
      pendingCalls.clear()
    }

    port.onMessage.addListener((message: FromTornadoCashDocument) => {
      if (message?.type === 'provider' || message?.type === 'derive-key') {
        answerHost(port, host, message).catch((error) => console.error(error))
        return
      }
      if (message?.type !== 'result' && message?.type !== 'failed') return

      const pending = pendingCalls.get(message.id)
      if (!pending) return
      clearTimeout(pending.timeout)
      pendingCalls.delete(message.id)

      if (message.type === 'result') pending.resolve(decodeTornadoCashValue(message.result))
      else
        pending.reject(
          new Error(message.message ?? 'tornadoCash: the withdrawal could not be built')
        )
    })
    port.onDisconnect.addListener(() => {
      isStopped = true
      rejectAll(new Error(TORNADO_CASH_PLUGIN_STOPPED_MESSAGE))
    })

    const call = (method: TornadoCashPluginMethod, params?: unknown) =>
      new Promise<unknown>((resolve, reject) => {
        if (isStopped) {
          reject(new Error(TORNADO_CASH_PLUGIN_STOPPED_MESSAGE))
          return
        }

        nextCallId += 1
        const id = nextCallId
        const timeout = setTimeout(() => {
          pendingCalls.delete(id)
          reject(new Error(`tornadoCash: ${method} took too long`))
        }, CALL_TIMEOUTS_MS[method])
        pendingCalls.set(id, { resolve, reject, timeout })
        port.postMessage({
          type: 'call',
          id,
          method,
          args: encodeTornadoCashValue([params])
        } satisfies ToTornadoCashDocument)
      })

    /** The first `dispose` call's closing, which later calls wait for too. */
    let disposing: Promise<void> | null = null
    const dispose = () => {
      // Its document is already gone, and the open one, if any, may be a newer plugin's
      if (!disposing && isStopped) disposing = Promise.resolve()
      if (!disposing) {
        isStopped = true
        rejectAll(new Error(TORNADO_CASH_PLUGIN_STOPPED_MESSAGE))
        port.disconnect()
        disposing = closeOwnDocument()
      }

      return disposing
    }
    stopCurrent = dispose

    return {
      sync: async () => {
        await call('sync')
      },
      notes: async () => (await call('notes')) as Awaited<ReturnType<TornadoCashPlugin['notes']>>,
      prepareShield: async (params) =>
        (await call('prepareShield', params)) as Awaited<
          ReturnType<TornadoCashPlugin['prepareShield']>
        >,
      prepareUnshield: async (params) =>
        (await call('prepareUnshield', params)) as Awaited<
          ReturnType<TornadoCashPlugin['prepareUnshield']>
        >,
      dispose
    }
  }

  return async (host) => {
    // One plugin at a time - see above
    if (stopCurrent) await stopCurrent()
    stopCurrent = null

    return startPlugin(host)
  }
}
