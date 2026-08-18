import { isDevice } from 'expo-device'
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { pbkdf2Sync, scrypt } from 'react-native-quick-crypto'
import { WebView } from 'react-native-webview'

import * as richJson from '@ambire-common/libs/richJson/richJson'
import { CONTROLLER_STORE_MAX_LOADING_TIME } from '@common/contexts/controllerStoreContext/controllerStore'
import eventBus from '@common/services/event/eventBus'
import { getAllSerialized, storage } from '@common/services/storage'
import { WEBVIEW_DEV_HOST } from '@env'
import { BOOT_SNAPSHOT_EXCLUDED_STORAGE_KEYS } from '@mobile/constants/storageSnapshot'
import {
  approveWalletConnectSession,
  approveWcAuthenticate,
  handleWcSessionBroadcast,
  prepareWcAuthenticate,
  rejectWalletConnectSession,
  rejectWcAuthenticate,
  respondToWalletConnectRequest
} from '@mobile/modules/wallet-connect/services/walletConnectService'
import WebviewDevServerError from '@mobile/modules/webview/components/WebviewDevServerError'
import getWebviewBundleUri from '@mobile/modules/webview/services/getWebviewBundleUri'
import materializeWorkerBundle, {
  getMaterializedWorkerBundleUri
} from '@mobile/modules/webview/services/materializeWorkerBundle'
import {
  BOOT_MARK,
  BOOT_MARK_PREFIX,
  BOOT_PROFILE_MARKS_EVENT,
  BOOT_PROFILE_MARKS_MESSAGE,
  bootProfiler,
  IS_BOOT_PROFILING_ENABLED,
  markBoot,
  markBootOnce,
  markStorageSnapshotKeys,
  monotonicNow,
  setWorkerBootProfile
} from '@mobile/services/bootProfiler'
import ledgerTransportService from '@mobile/services/ledger/ledgerTransportService'
import { beginNfcPinSessions, endNfcPinSessions, getNfcCardService } from '@mobile/services/nfc'
import trezorDeeplinkService from '@mobile/services/trezor/trezorDeeplinkService'

import { decode, encode } from './bridgeCodec'

// In production the worker bundle is materialized from the OTA-shipped copy (which rides
// the Metro bundle) into a writable, app-sandboxed dir and loaded from there via `file://`,
// so OTA updates reach it. It falls back to the native-asset copy baked into the signed app
// if materialization fails. Either way the HTML stub carries a strict CSP (`script-src
// file:`) and a SHA-384 SRI pinning its sibling `<script src>`, both built together so the
// SRI always matches the JS. In dev the bundle is fetched from webpack-dev-server (HTTP) so
// HMR keeps working. The bundle URI resolves asynchronously (see materializeWorkerBundle),
// so the WebView mounts only once it is ready.

// The dev server URL for webpack-dev-server.
// - Simulator/emulator: auto-detected via Device.isDevice; uses platform loopback (localhost / 10.0.2.2)
// - Real device: set WEBVIEW_DEV_HOST to the host machine's LAN IP in .env
const WEBVIEW_DEV_SERVER_PORT = 8182
const DEV_SERVER_PROBE_INTERVAL = 2000
const getDevServerUrl = () => {
  if (!isDevice) {
    return Platform.OS === 'android'
      ? `http://10.0.2.2:${WEBVIEW_DEV_SERVER_PORT}`
      : `http://localhost:${WEBVIEW_DEV_SERVER_PORT}`
  }
  return `http://${WEBVIEW_DEV_HOST}:${WEBVIEW_DEV_SERVER_PORT}`
}

// Global error handler injected into the WebView HTML
const globalErrorHandler = `
  window.onerror = function(msg, url, lineNo, columnNo, error) {
    var errMessage = error ? error.stack || error.message : msg;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ctrl.error', payload: { ctrlName: 'Global', errors: [{ message: errMessage, url: url, lineNo: lineNo }] } }));
    return false;
  };
`

export interface WebViewWorkerRef {
  dispatch: (action: any, raw?: boolean) => void
  init: (config: any) => Promise<string[]>
}

export const WebViewWorker = forwardRef<WebViewWorkerRef, object>((_, ref) => {
  const webviewRef = useRef<WebView>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const isReadyRef = useRef(false)
  const initResolver = useRef<((ctrls: string[]) => void) | null>(null)
  const initReadyWarningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingConfig = useRef<any>(null)
  // Stores the last config so we can re-send it when the WebView reloads (dev HMR/live
  // reload, renderer crash). Holds no storage snapshot — that is taken fresh per injection.
  const lastConfig = useRef<any>(null)
  // Incrementing the key forces a full WebView remount (used for Android dev reload)
  const [webviewKey, setWebviewKey] = useState(0)
  const devUrl = getDevServerUrl()

  // Worker bundle URI. In prod it is materialized from the OTA-shipped copy into a writable
  // dir (so OTA updates reach it). Resolved synchronously when that dir already holds the
  // current bundle - which is every launch except the first one after an install or an OTA -
  // so the WebView mounts on the first render instead of a promise gating it. Empty only on
  // the launch that has to write the bundle out first, which gates the mount below.
  const [prodBundleUri, setProdBundleUri] = useState(() =>
    __DEV__ ? '' : getMaterializedWorkerBundleUri() || ''
  )

  // Dev only. The worker bundle is a subresource of the WebView's inline HTML, so
  // a missing dev server fires neither onError nor onHttpError - the app just hangs
  // on the splash with nothing but a console warning. Optimistic, so the happy path
  // mounts the WebView without waiting for the first probe.
  const [isDevServerReachable, setIsDevServerReachable] = useState(true)
  const wasDevServerReachableRef = useRef(true)
  // Sticky, so the notice stays up until the worker actually boots instead of
  // flashing back to a blank screen the moment the dev server answers again.
  const [hasDevServerFailed, setHasDevServerFailed] = useState(false)

  useEffect(() => {
    if (!__DEV__ || isReady) return undefined

    let isActive = true
    let probeTimeoutId: ReturnType<typeof setTimeout> | null = null

    const probe = async () => {
      let isReachable = false
      try {
        // Any HTTP response means the server is up. Only a transport failure
        // (connection refused, wrong host) counts as unreachable.
        await fetch(`${devUrl}/webview-bundle.js`, { method: 'HEAD' })
        isReachable = true
      } catch {
        isReachable = false
      }

      if (!isActive) return

      // Back up after being down: the WebView still holds the page whose <script>
      // failed and nothing retries it, so remount to re-fetch the bundle.
      if (isReachable && !wasDevServerReachableRef.current) setWebviewKey((k) => k + 1)
      wasDevServerReachableRef.current = isReachable
      setIsDevServerReachable(isReachable)
      if (!isReachable) setHasDevServerFailed(true)

      probeTimeoutId = setTimeout(probe, DEV_SERVER_PROBE_INTERVAL)
    }

    void probe()

    return () => {
      isActive = false
      if (probeTimeoutId) clearTimeout(probeTimeoutId)
    }
  }, [devUrl, isReady])

  useEffect(() => {
    if (__DEV__ || prodBundleUri) return undefined

    let isActive = true
    // Falls back to the native-asset bundle baked into the signed app if the OTA copy
    // cannot be materialized, so the worker always has a working bundle to load.
    bootProfiler
      .measureAsync(BOOT_MARK.rnWorkerBundleMaterialized, materializeWorkerBundle())
      .then((uri) => {
        if (isActive) setProdBundleUri(uri || getWebviewBundleUri())
      })

    return () => {
      isActive = false
    }
  }, [prodBundleUri])

  const clearInitWarningTimeout = () => {
    if (initReadyWarningTimeoutRef.current) {
      clearTimeout(initReadyWarningTimeoutRef.current)
      initReadyWarningTimeoutRef.current = null
    }
  }

  const scheduleInitWarningTimeout = () => {
    if (!__DEV__) return
    clearInitWarningTimeout()
    initReadyWarningTimeoutRef.current = setTimeout(() => {
      if (initResolver.current && !isReadyRef.current) {
        console.warn(
          `[WebViewWorker] Controllers are not ready after ${CONTROLLER_STORE_MAX_LOADING_TIME}ms. ` +
            `Actions may be dropped. Dev host: ${devUrl}. ` +
            `If you are developing locally, ensure the webview dev server is running.`
        )
      }
    }, CONTROLLER_STORE_MAX_LOADING_TIME)
  }

  const dispatchToWebView = (action: any, raw?: boolean) => {
    const embedded = raw
      ? richJson.stringify({ type: 'dispatchAction', action })
      : JSON.stringify(
          encode({ type: 'dispatchAction', action }, action?.type !== 'HANDLE_PROVIDER_REQUEST')
        )
    webviewRef.current?.injectJavaScript(`
        (function() {
          try {
            window.postMessage(${embedded}, '*');
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ctrl.error', payload: { ctrlName: 'BridgeDispatch', errors: [{ message: e.message, stack: e.stack }] } }));
          }
        })();
        true;
      `)
  }

  // Shared by the two paths that hand the worker its config: init() when the
  // WebView has already loaded, and the system.loaded handler otherwise (plus dev
  // reloads). The richJson stringify here covers the whole storage snapshot, which
  // is why it is measured separately from the injectJavaScript hop.
  //
  // PERF: ship a one-shot snapshot of async storage so the worker can seed an
  // in-memory cache and serve controller-boot reads locally instead of making 80+
  // separate bridged storage.get round-trips (each delivered via its own
  // injectJavaScript), which saturated the bridge for seconds. Bulk keys no
  // controller needs to construct are left out of it (see
  // BOOT_SNAPSHOT_EXCLUDED_STORAGE_KEYS) and fetched over the bridge on first use —
  // the snapshot's `allKeys` is what lets the worker tell those apart from keys that
  // genuinely are not stored.
  //
  // The snapshot is taken here, not once in init(), so a worker that reloads (dev
  // HMR, a renderer crash) is seeded with what storage holds NOW. Reusing the
  // boot-time snapshot would hide every write made since from the new context.
  const injectInitPayload = (configToSend: any) => {
    bootProfiler.startSpan(BOOT_MARK.rnStorageSnapshot)
    const storageSnapshot = getAllSerialized(BOOT_SNAPSHOT_EXCLUDED_STORAGE_KEYS)
    bootProfiler.endSpan(BOOT_MARK.rnStorageSnapshot, {
      count: Object.keys(storageSnapshot.values).length
    })
    markStorageSnapshotKeys(storageSnapshot)

    bootProfiler.startSpan(BOOT_MARK.rnInitPayloadEncoded)
    const initPayload = encode(
      {
        type: 'init',
        config: {
          ...configToSend,
          __storageSnapshot: storageSnapshot
        }
      },
      true
    )
    bootProfiler.endSpan(BOOT_MARK.rnInitPayloadEncoded, { bytes: initPayload.length })

    webviewRef.current?.injectJavaScript(`
        window.postMessage(${JSON.stringify(initPayload)}, '*');
        true;
      `)
    markBoot(BOOT_MARK.rnInitPayloadInjected)
  }

  useImperativeHandle(ref, () => ({
    dispatch: (action: any, raw?: boolean) => {
      if (!isReadyRef.current) return
      dispatchToWebView(action, raw)
    },
    init: (config: any) => {
      lastConfig.current = config
      return new Promise((resolve) => {
        initResolver.current = resolve
        scheduleInitWarningTimeout()
        if (isLoaded) {
          injectInitPayload(config)
        } else {
          pendingConfig.current = config
        }
      })
    }
  }))

  // Times the richJson parse of the first state received per controller, together
  // with the wire size that produced it. The message type is only known after
  // decoding, so the duration is captured first and attributed afterwards. Guarded
  // by the flag because every dapp JSON-RPC message also flows through here.
  const decodeAndProfile = (raw: string) => {
    if (!IS_BOOT_PROFILING_ENABLED) return decode(raw)

    const startedAt = monotonicNow()
    const data = decode(raw)
    if (data?.type !== 'ctrl.update') return data

    const markName = `${BOOT_MARK_PREFIX.rnCtrlDecode}${data.payload?.ctrlName}`
    if (bootProfiler.reserveOnce(markName))
      markBoot(markName, { durationMs: monotonicNow() - startedAt, bytes: raw.length })

    return data
  }

  const handleMessage = async (event: any) => {
    try {
      const raw: string = event.nativeEvent.data
      const data = decodeAndProfile(raw)

      switch (data.type) {
        case BOOT_PROFILE_MARKS_MESSAGE:
          // The worker's half of the timeline. Handed to the profiler and also
          // re-emitted so whoever asked for it knows it has landed.
          setWorkerBootProfile(data.payload)
          eventBus.emit(BOOT_PROFILE_MARKS_EVENT, data.payload)
          break

        case 'system.loaded': {
          const isReload = isReadyRef.current
          markBootOnce(BOOT_MARK.rnWorkerLoadedReceived)
          if (__DEV__) {
            const isReloadStr = isReload ? ' (RELOAD detected)' : ''
            console.log(`[WebViewWorker] WebView internal script loaded${isReloadStr}`)
          }

          // Reset ready state — the WebView has a fresh JS context
          isReadyRef.current = false
          setIsReady(false)
          setIsLoaded(true)

          // Determine which config to send:
          // - On first load: use pendingConfig (set by init())
          // - On reload (dev HMR): use lastConfig (the previously sent config)
          const configToSend = pendingConfig.current || (isReload ? lastConfig.current : null)

          if (configToSend) {
            injectInitPayload(configToSend)
            pendingConfig.current = null
          }
          break
        }

        // Android dev reload: webpack-dev-server triggers location.reload() which we
        // intercept and redirect here. Incrementing webviewKey forces a full remount,
        // causing the WebView to re-fetch the latest bundle from the dev server.
        case 'system.requestReload':
          isReadyRef.current = false
          setIsReady(false)
          setIsLoaded(false)
          // Use lastConfig so the re-initialized WebView picks up the same config
          pendingConfig.current = lastConfig.current
          setWebviewKey((k) => k + 1)
          break

        case 'system.ready':
          clearInitWarningTimeout()
          markBootOnce(BOOT_MARK.rnWorkerReadyReceived, {
            count: data.payload.controllers?.length
          })
          isReadyRef.current = true
          setIsReady(true)
          if (initResolver.current) {
            initResolver.current(data.payload.controllers)
            initResolver.current = null
          }
          break

        case 'ctrl.update':
          eventBus.emit('ctrlUpdate', {
            ctrlName: data.payload.ctrlName,
            ctrlState: data.payload.state,
            forceEmit: data.payload.forceEmit
          })
          break

        case 'ctrl.error':
          eventBus.emit('error', { errors: data.payload.errors, controller: data.payload.ctrlName })
          break

        case 'ctrl.debug':
          console.log(data.payload.log)
          break

        case 'action.addToast':
          eventBus.emit('addToast', data.payload)
          break

        case 'action.receiveOneTimeData':
          eventBus.emit('receiveOneTimeData', data.payload)
          break
        case 'action.sendToDappWebView':
          eventBus.emit('action.sendToDappWebView', data.payload)
          break
        case 'action.broadcastDappEvent':
          eventBus.emit('action.broadcastDappEvent', data.payload)
          break
        case 'action.navigate':
          eventBus.emit('navigate', data.payload)
          break
        case 'action.respondToWalletConnectRequest':
          await respondToWalletConnectRequest(
            data.payload.topic,
            data.payload.response,
            data.payload.id
          )
          break
        case 'action.approveWalletConnectSession':
          await approveWalletConnectSession(
            data.payload.proposalId,
            data.payload.accounts,
            (action, _windowId, raw) => dispatchToWebView(action, raw)
          )
          break
        case 'action.rejectWalletConnectSession':
          await rejectWalletConnectSession(data.payload.proposalId)
          break
        case 'action.wcSessionBroadcast':
          await handleWcSessionBroadcast(data.payload)
          break
        case 'action.prepareWcAuthenticate':
          // Account selected — format SIWE message and re-dispatch as personal_sign
          await prepareWcAuthenticate(
            data.payload.id,
            data.payload.accounts[0],
            (action, _windowId, raw) => dispatchToWebView(action, raw)
          )
          break
        case 'action.approveWalletConnectAuthenticate':
          await approveWcAuthenticate(
            data.payload.id,
            data.payload.signature,
            (action, _windowId, raw) => dispatchToWebView(action, raw)
          )
          break
        case 'action.rejectWalletConnectAuthenticate':
          await rejectWcAuthenticate(data.payload.id)
          break
        case 'ui.window.action': {
          const requestId = data.id
          // Emit with a resolve callback the RN handler can call when the
          // animation completes, settling the promise on the controller side.
          eventBus.emit('ui.window.action', {
            ...data.payload,
            resolve: () => sendResponse(requestId, null)
          })
          break
        }

        // --- PROXY HANDLERS FOR STORAGE ---
        case 'storage.get':
          const getVal = await storage.get(data.payload.key, data.payload.defaultValue)
          sendResponse(data.id, getVal, null, true)
          break
        case 'storage.set':
          await storage.set(data.payload.key, data.payload.value)
          sendResponse(data.id, null)
          break
        case 'storage.remove':
          await storage.remove(data.payload.key)
          sendResponse(data.id, null)
          break

        // --- CRYPTO DELEGATION HANDLERS ---
        case 'crypto.scrypt':
          {
            const { password, salt, N, r, p, dkLen } = data.payload

            // Reconstruct Uint8Arrays as richJson doesn't support them natively
            const passwordUint8 =
              password instanceof Uint8Array ? password : new Uint8Array(Object.values(password))
            const saltUint8 =
              salt instanceof Uint8Array ? salt : new Uint8Array(Object.values(salt))

            scrypt(
              passwordUint8,
              saltUint8,
              dkLen,
              { N, r, p, maxmem: 256 * 1024 * 1024 },
              (err: Error | null, derivedKey?: any) => {
                if (err) {
                  sendResponse(data.id, null, err.message)
                } else {
                  // Ensure we send a plain array across the bridge
                  sendResponse(data.id, Array.from(derivedKey))
                }
              }
            )
          }
          break
        case 'crypto.pbkdf2':
          {
            const { password, salt, iterations, keylen, digest } = data.payload
            try {
              // Reconstruct Uint8Arrays
              const passwordUint8 =
                password instanceof Uint8Array ? password : new Uint8Array(Object.values(password))
              const saltUint8 =
                salt instanceof Uint8Array ? salt : new Uint8Array(Object.values(salt))

              const res = pbkdf2Sync(passwordUint8, saltUint8, iterations, keylen, digest)
              // Ensure we send a plain array across the bridge
              sendResponse(data.id, Array.from(res))
            } catch (err: any) {
              sendResponse(data.id, null, err.message)
            }
          }
          break

        // --- NETWORK FETCH PROXY ---
        case 'network.fetch':
          {
            const { url, method, headers, body } = data.payload
            try {
              const fetchOpts: RequestInit = { method, headers }
              if (body !== null && body !== undefined) {
                fetchOpts.body = body
              }
              const response = await fetch(url, fetchOpts)

              // Serialize response headers to a plain object
              const responseHeaders: Record<string, string> = {}
              response.headers.forEach((value: string, key: string) => {
                responseHeaders[key] = value
              })

              const responseBody = await response.text()

              sendResponse(data.id, {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                body: responseBody,
                url: response.url || url
              })
            } catch (fetchErr: any) {
              sendResponse(data.id, null, fetchErr.message || 'Network request failed')
            }
          }
          break

        // --- LEDGER DEVICE DELEGATION HANDLERS ---
        // The worker-side LedgerController forwards device operations here; the
        // actual BLE/USB transport + Ethereum app run natively in
        // ledgerTransportService. Scanning/connecting is driven separately from the
        // RN connect screen (via the useLedger hook), not over this bridge.
        case 'ledger.getAddress':
          try {
            const address = await ledgerTransportService.getAddress(data.payload.path)
            sendResponse(data.id, address)
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        case 'ledger.retrieveAddresses':
          try {
            const addresses: string[] = []
            // Serialized one-by-one (the service queue enforces this too); the
            // Ledger can't handle parallel getAddress calls.
            for (const path of data.payload.paths) {
              addresses.push(await ledgerTransportService.getAddress(path))
            }
            sendResponse(data.id, addresses)
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        case 'ledger.signPersonalMessage':
          try {
            const sig = await ledgerTransportService.signPersonalMessage(
              data.payload.path,
              data.payload.messageHex
            )
            sendResponse(data.id, sig)
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        case 'ledger.signTransaction':
          try {
            const sig = await ledgerTransportService.signTransaction(
              data.payload.path,
              data.payload.rawTxHex
            )
            sendResponse(data.id, sig)
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        case 'ledger.signTypedData':
          try {
            const sig = await ledgerTransportService.signTypedData(
              data.payload.path,
              data.payload.typedData
            )
            sendResponse(data.id, sig)
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        case 'ledger.signingCleanup':
          // Flushes the device's pending command state after an abandoned/rejected
          // sign so the next command starts clean. Does NOT cancel an in-flight
          // on-device prompt (that still resolves on the device). Best-effort.
          try {
            await ledgerTransportService.signingCleanup()
            sendResponse(data.id, null)
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        case 'ledger.cleanUp':
          try {
            await ledgerTransportService.cleanUp()
            sendResponse(data.id, null)
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break

        // --- TREZOR DEVICE DELEGATION HANDLERS ---
        // The worker-side TrezorController forwards each Trezor Connect SDK call
        // here; the SDK (@trezor/connect-mobile) runs natively in
        // trezorDeeplinkService and delegates to the Trezor Suite app via
        // deep links. Each handler returns the raw `{ success, payload }` connect
        // response so the shared TrezorSigner / TrezorKeyIterator can inspect it.
        case 'trezor.ethereumGetAddress':
          try {
            sendResponse(data.id, await trezorDeeplinkService.ethereumGetAddress(data.payload))
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        case 'trezor.getPublicKey':
          try {
            sendResponse(data.id, await trezorDeeplinkService.getPublicKey(data.payload))
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        case 'trezor.ethereumSignTransaction':
          try {
            sendResponse(data.id, await trezorDeeplinkService.ethereumSignTransaction(data.payload))
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        case 'trezor.ethereumSignTypedData':
          try {
            sendResponse(data.id, await trezorDeeplinkService.ethereumSignTypedData(data.payload))
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        case 'trezor.ethereumSignMessage':
          try {
            sendResponse(data.id, await trezorDeeplinkService.ethereumSignMessage(data.payload))
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        case 'trezor.signingCleanup':
          try {
            await trezorDeeplinkService.signingCleanup()
            sendResponse(data.id, null)
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        case 'nfc.signHash': {
          const { nfcWalletType, ...signHashParams } = data.payload

          try {
            sendResponse(data.id, await getNfcCardService(nfcWalletType).signHash(signHashParams))
          } catch (err: any) {
            sendResponse(data.id, null, err.message)
          }
          break
        }
        case 'nfc.cancel':
          getNfcCardService(data.payload.nfcWalletType).cancel()
          sendResponse(data.id, null)
          break
        case 'nfc.beginPinSession':
          beginNfcPinSessions()
          sendResponse(data.id, null)
          break
        case 'nfc.endPinSession':
          endNfcPinSessions()
          sendResponse(data.id, null)
          break

        default:
          if (__DEV__) console.warn('Unknown message from WebViewWorker:', data.type)
      }
    } catch (e) {
      console.error('Failed to handle message from WebView worker', e)
    }
  }

  const sendResponse = (id: number, result: any = null, error: any = null, rich = false) => {
    webviewRef.current?.injectJavaScript(`
        window.postMessage(${JSON.stringify(
          encode({ type: 'response', id, result, error: error?.message || error }, rich)
        )}, '*');
        true;
      `)
  }

  // Production loads the static HTML stub from disk; dev keeps the inline
  // template that points at webpack-dev-server so HMR keeps working.
  const prodBundleDir = prodBundleUri.replace(/\/[^/]+$/, '/')
  const source = !__DEV__
    ? { uri: prodBundleUri }
    : (() => {
        const devCsp = `default-src 'none'; script-src ${devUrl}; connect-src ${devUrl} ws: wss:; frame-src 'none'; object-src 'none';`
        return {
          html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="${devCsp}">
          </head>
          <body>
            <script src="${devUrl}/webview-bundle.js"></script>
          </body>
        </html>
      `,
          baseUrl: 'file:///'
        }
      })()

  const handleRenderProcessGone = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent || {}
    console.warn('[WebViewWorker] WebView process terminated, remounting worker...', nativeEvent)
    isReadyRef.current = false
    setIsReady(false)
    setIsLoaded(false)
    pendingConfig.current = lastConfig.current
    setWebviewKey((k) => k + 1)
  }

  const injectedJSBefore = __DEV__
    ? `
      ${globalErrorHandler}

      // Fix Webpack Dev Server WebSocket URL when baseUrl is file:///
      // and detect recompilation to trigger a RN-side WebView remount
      var OriginalWebSocket = window.WebSocket;
      var _wdsLastHash = null;
      var _wdsPendingReload = false;
      window.WebSocket = function(url, protocols) {
        var connectUrl = url;
        if (url && (url.indexOf('ws:///') === 0 || url.indexOf('wss:///') === 0 || url.indexOf('0.0.0.0') > -1)) {
          connectUrl = '${devUrl}'.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
        }
        var ws = protocols ? new OriginalWebSocket(connectUrl, protocols) : new OriginalWebSocket(connectUrl);

        ws.addEventListener('message', function(event) {
          try {
            var msg = JSON.parse(event.data);
            if (msg.type === 'hash') {
              if (_wdsLastHash !== null && _wdsLastHash !== msg.data) {
                _wdsPendingReload = true;
              }
              _wdsLastHash = msg.data;
            }
            if (msg.type === 'ok' && _wdsPendingReload) {
              _wdsPendingReload = false;
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'system.requestReload' }));
              }
            }
          } catch (e) {}
        });

        return ws;
      };
      window.WebSocket.prototype = OriginalWebSocket.prototype;
      window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      window.WebSocket.OPEN = OriginalWebSocket.OPEN;
      window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
      window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;

      true;
    `
    : `
      ${globalErrorHandler}
      true;
    `

  // Prod: hold off mounting until the worker bundle URI resolves (see top-of-file note).
  // The worker is invisible and init() queues via pendingConfig, so this only defers boot.
  if (!__DEV__ && !prodBundleUri) return null

  // Past this point the WebView element is returned, so the gap from here to
  // `worker.bundle.evalStart` is WebView process spawn + HTML load + bundle
  // fetch and parse — the part no JS inside either realm can see on its own.
  markBootOnce(BOOT_MARK.rnWebviewMounted)

  return (
    <>
      {__DEV__ && hasDevServerFailed && !isReady && (
        <WebviewDevServerError devUrl={devUrl} isDevServerReachable={isDevServerReachable} />
      )}
      <WebView
        key={webviewKey}
        ref={webviewRef}
        source={source}
        onMessage={handleMessage}
        onLoadStart={() => markBootOnce(BOOT_MARK.rnWebviewLoadStart)}
        onLoadEnd={() => markBootOnce(BOOT_MARK.rnWebviewLoadEnd)}
        onError={(syntheticEvent) => {
          if (__DEV__) {
            const { nativeEvent } = syntheticEvent
            console.warn(
              `[WebViewWorker] WebView Error (dev host: ${devUrl}). If the dev webview server is down, start it and reload the app.`,
              nativeEvent
            )
          }
        }}
        onHttpError={(syntheticEvent) => {
          if (__DEV__) {
            const { nativeEvent } = syntheticEvent
            console.warn(
              `[WebViewWorker] WebView HTTP Error (dev host: ${devUrl}). ` +
                `This usually means the dev webview server is not started.`,
              nativeEvent
            )
          }
        }}
        onRenderProcessGone={handleRenderProcessGone}
        onContentProcessDidTerminate={handleRenderProcessGone}
        javaScriptEnabled={true}
        injectedJavaScriptBeforeContentLoaded={injectedJSBefore}
        // iOS only: grant the WebView read access to the bundle directory so
        // the HTML's sibling `<script src="webview-bundle.js">` can resolve.
        // Without this, `loadFileURL` scopes access to the HTML file alone.
        allowingReadAccessToURL={__DEV__ ? undefined : prodBundleDir}
        originWhitelist={__DEV__ ? ['file://*', `${devUrl}/*`] : ['file://*']}
        onShouldStartLoadWithRequest={(request) => {
          if (__DEV__) {
            return request.url.startsWith('file:///') || request.url.startsWith(devUrl)
          }
          // In production the WebView only ever navigates to the bundled HTML
          // stub. The bundle JS is loaded as a sibling `<script src>` from inside
          // that page (so we never see a navigation for it here). Anything else
          // is rejected.
          return request.url === prodBundleUri
        }}
        mixedContentMode="never"
        // Android-only, defaults to false. Required in prod so the WebView can load the
        // worker HTML that materializeWorkerBundle() writes to the app's files dir (a real
        // `file://` path, unlike the exempt `file:///android_asset/` fallback). Without it
        // the worker never boots and the app hangs on the splash screen. No-op on iOS, which
        // uses allowingReadAccessToURL above.
        allowFileAccess={!__DEV__}
        // Required on Android for the sibling `<script src>` to load over
        // `file://`. Safe: navigation is locked to the single bundle URI and
        // `allowUniversalAccessFromFileURLs` stays `false`, so the page cannot
        // reach http(s) or cross-origin resources.
        allowFileAccessFromFileURLs={!__DEV__}
        allowUniversalAccessFromFileURLs={false}
        domStorageEnabled={true}
        webviewDebuggingEnabled={__DEV__}
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
        containerStyle={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
        pointerEvents="none"
      />
    </>
  )
})

WebViewWorker.displayName = 'WebViewWorker'
