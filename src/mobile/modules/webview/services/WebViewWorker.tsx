import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { isDevice } from 'expo-device'
import { pbkdf2Sync, scrypt } from 'react-native-quick-crypto'
import { WebView } from 'react-native-webview'

import * as richJson from '@ambire-common/libs/richJson/richJson'
import { CONTROLLER_STORE_MAX_LOADING_TIME } from '@common/contexts/controllerStoreContext/controllerStore'
import eventBus from '@common/services/event/eventBus'
import { storage } from '@common/services/storage'
import { WEBVIEW_DEV_HOST } from '@env'
import getWebviewBundleUri from '@mobile/modules/webview/services/getWebviewBundleUri'
import {
  approveWalletConnectSession,
  approveWcAuthenticate,
  handleWcSessionBroadcast,
  prepareWcAuthenticate,
  rejectWalletConnectSession,
  rejectWcAuthenticate,
  respondToWalletConnectRequest
} from '@mobile/modules/wallet-connect/services/walletConnectService'

// In production the worker bundle ships as a static file inside the signed
// app (iOS Resources / Android assets) and the WebView loads it from disk via
// `file://`. The HTML stub is built at compile time with a CSP that only
// allows the bundle to load and a SHA-384 integrity hash that WKWebView
// validates before executing.
// In dev the bundle is fetched from webpack-dev-server (HTTP) so HMR keeps
// working.
const PROD_BUNDLE_URI = !__DEV__ ? getWebviewBundleUri() : ''
// Directory containing the HTML + JS pair. WKWebView's `loadFileURL` defaults
// its read-access scope to the HTML file alone, which blocks the inline XHR
// from reaching the sibling `webview-bundle.js`. We grant read access to the
// directory only — narrowest scope that lets the bundle load.
const PROD_BUNDLE_DIR = !__DEV__ ? PROD_BUNDLE_URI.replace(/\/[^/]+$/, '/') : ''

// The dev server URL for webpack-dev-server.
// - Simulator/emulator: auto-detected via Device.isDevice; uses platform loopback (localhost / 10.0.2.2)
// - Real device: set WEBVIEW_DEV_HOST to the host machine's LAN IP in .env
const WEBVIEW_DEV_SERVER_PORT = 8182
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

export const WebViewWorker = forwardRef<WebViewWorkerRef, {}>((_, ref) => {
  const webviewRef = useRef<WebView>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const isReadyRef = useRef(false)
  const initResolver = useRef<((ctrls: string[]) => void) | null>(null)
  const initReadyWarningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingConfig = useRef<any>(null)
  // Stores the last config so we can re-send it when the WebView reloads (dev HMR/live reload)
  const lastConfig = useRef<any>(null)
  // Incrementing the key forces a full WebView remount (used for Android dev reload)
  const [webviewKey, setWebviewKey] = useState(0)
  const devUrl = getDevServerUrl()

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
    const payload = richJson.stringify({ type: 'dispatchAction', action })
    webviewRef.current?.injectJavaScript(`
        (function() {
          try {
            window.postMessage(${raw ? payload : JSON.stringify(payload)}, '*');
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ctrl.error', payload: { ctrlName: 'BridgeDispatch', errors: [{ message: e.message, stack: e.stack }] } }));
          }
        })();
        true;
      `)
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
          const initPayload = richJson.stringify({ type: 'init', config })
          webviewRef.current?.injectJavaScript(`
              window.postMessage(${JSON.stringify(initPayload)}, '*');
              true;
            `)
        } else {
          pendingConfig.current = config
        }
      })
    }
  }))

  const handleMessage = async (event: any) => {
    try {
      const data = richJson.parse(event.nativeEvent.data)

      switch (data.type) {
        case 'system.loaded': {
          const isReload = isReadyRef.current
          const isReloadStr = isReload ? ' (RELOAD detected)' : ''
          console.log(`[WebViewWorker] WebView internal script loaded${isReloadStr}`)

          // Reset ready state — the WebView has a fresh JS context
          isReadyRef.current = false
          setIsReady(false)
          setIsLoaded(true)

          // Determine which config to send:
          // - On first load: use pendingConfig (set by init())
          // - On reload (dev HMR): use lastConfig (the previously sent config)
          const configToSend = pendingConfig.current || (isReload ? lastConfig.current : null)

          if (configToSend) {
            const initPayload = richJson.stringify({ type: 'init', config: configToSend })
            webviewRef.current?.injectJavaScript(`
                window.postMessage(${JSON.stringify(initPayload)}, '*');
                true;
              `)
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
          sendResponse(data.id, getVal)
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

        default:
          console.warn('Unknown message from WebViewWorker:', data.type)
      }
    } catch (e) {
      console.error('Failed to handle message from WebView worker', e)
    }
  }

  const sendResponse = (id: number, result: any = null, error: any = null) => {
    webviewRef.current?.injectJavaScript(`
        window.postMessage(${JSON.stringify(
          richJson.stringify({ type: 'response', id, result, error: error?.message || error })
        )}, '*');
        true;
      `)
  }

  // Production loads the static HTML stub from disk; dev keeps the inline
  // template that points at webpack-dev-server so HMR keeps working.
  const source = !__DEV__
    ? { uri: PROD_BUNDLE_URI }
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

  return (
    <WebView
      key={webviewKey}
      ref={webviewRef}
      source={source}
      onMessage={handleMessage}
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
      allowingReadAccessToURL={__DEV__ ? undefined : PROD_BUNDLE_DIR}
      originWhitelist={__DEV__ ? ['file://*', `${devUrl}/*`] : ['file://*']}
      onShouldStartLoadWithRequest={(request) => {
        if (__DEV__) {
          return request.url.startsWith('file:///') || request.url.startsWith(devUrl)
        }
        // In production the WebView only ever navigates to the bundled HTML
        // stub. The bundle JS is fetched via XHR from inside that page (so we
        // never see a navigation for it here). Anything else is rejected.
        return request.url === PROD_BUNDLE_URI
      }}
      mixedContentMode="never"
      // In prod the worker page is `file://...html` and pulls its sibling JS
      // via XHR + eval (so we can capture exceptions in our own try/catch
      // rather than getting WKWebView's masked "Script error."). XHR between
      // sibling file:// resources requires this flag. Both files live inside
      // the signed `.app` bundle, alongside no other content, so widening
      // file:// access to file:// is benign here.
      allowFileAccessFromFileURLs={!__DEV__}
      allowUniversalAccessFromFileURLs={false}
      domStorageEnabled={true}
      webviewDebuggingEnabled={__DEV__}
      style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
      containerStyle={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
      pointerEvents="none"
    />
  )
})
