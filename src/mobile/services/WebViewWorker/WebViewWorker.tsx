import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { pbkdf2Sync, scrypt } from 'react-native-quick-crypto'
import { WebView } from 'react-native-webview'

import * as richJson from '@ambire-common/libs/richJson/richJson'
import eventBus from '@common/services/event/eventBus'
import { storage } from '@common/services/storage'
import { WEBVIEW_DEV_HOST } from '@env'

// In production, the bundle is inlined via the JSON import.
// In dev, we load from webpack-dev-server so this import is unused.
// @ts-ignore
const webviewBundle = __DEV__ ? null : require('./webview-bundle.json')

// The dev server URL for webpack-dev-server.
// - iOS: localhost works directly
// - Android: env WEBVIEW_DEV_HOST or fallback to 10.0.2.2
const WEBVIEW_DEV_SERVER_PORT = 8082
const getDevServerUrl = () => {
  if (Platform.OS === 'android') {
    return `http://${WEBVIEW_DEV_HOST || '10.0.2.2'}:${WEBVIEW_DEV_SERVER_PORT}`
  }
  return `http://localhost:${WEBVIEW_DEV_SERVER_PORT}`
}

// Shared security patches: monkey-patch fetch/XHR to block file:// access
const securityPatches = `
  var _originalFetch = window.fetch;
  window.fetch = function() {
    var url = arguments[0];
    if (typeof url === 'string' && url.indexOf('file://') === 0) {
      return Promise.reject(new Error('fetch to file:// is blocked for security.'));
    }
    if (url && typeof url === 'object' && url.url && url.url.indexOf('file://') === 0) {
      return Promise.reject(new Error('fetch to file:// is blocked for security.'));
    }
    return _originalFetch.apply(this, arguments);
  };
  var _originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && url.indexOf('file://') === 0) {
      throw new Error('XHR to file:// is blocked for security.');
    }
    return _originalOpen.apply(this, arguments);
  };
  window.onerror = function(msg, url, lineNo, columnNo, error) {
    var errMessage = error ? error.stack || error.message : msg;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ctrl.error', payload: { ctrlName: 'Global', errors: [{ message: errMessage, url: url, lineNo: lineNo }] } }));
    return false;
  };
`

export interface WebViewWorkerRef {
  dispatch: (action: any) => void
  init: (config: any) => Promise<string[]>
}

export const WebViewWorker = forwardRef<WebViewWorkerRef, {}>((_, ref) => {
  const webviewRef = useRef<WebView>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const isReadyRef = useRef(false)
  const initResolver = useRef<((ctrls: string[]) => void) | null>(null)
  const pendingConfig = useRef<any>(null)
  // Stores the last config so we can re-send it when the WebView reloads (dev HMR/live reload)
  const lastConfig = useRef<any>(null)
  // Incrementing the key forces a full WebView remount (used for Android dev reload)
  const [webviewKey, setWebviewKey] = useState(0)

  useImperativeHandle(ref, () => ({
    dispatch: (action: any) => {
      if (!isReadyRef.current) {
        console.warn('[Native] WebViewWorker NOT READY. Dropping action:', action.type)
        return
      }
      const payload = richJson.stringify({ type: 'dispatchAction', action })
      webviewRef.current?.injectJavaScript(`
          (function() {
            try {
              window.postMessage(${JSON.stringify(payload)}, '*');
            } catch (e) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ctrl.error', payload: { ctrlName: 'BridgeDispatch', errors: [{ message: e.message, stack: e.stack }] } }));
            }
          })();
          true;
        `)
    },
    init: (config: any) => {
      console.log('[WebViewWorker] init called, setting resolver')
      lastConfig.current = config
      return new Promise((resolve) => {
        initResolver.current = resolve
        if (isLoaded) {
          console.log('[WebViewWorker] WebView already loaded, sending init immediately')
          webviewRef.current?.injectJavaScript(`
              window.postMessage(${JSON.stringify(richJson.stringify({ type: 'init', config }))}, '*');
              true;
            `)
        } else {
          console.log('[WebViewWorker] WebView not loaded yet, buffering config')
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
          console.log(
            `[WebViewWorker] WebView internal script loaded${isReload ? ' (RELOAD detected)' : ''}`
          )

          // Reset ready state — the WebView has a fresh JS context
          isReadyRef.current = false
          setIsReady(false)
          setIsLoaded(true)

          // Determine which config to send:
          // - On first load: use pendingConfig (set by init())
          // - On reload (dev HMR): use lastConfig (the previously sent config)
          const configToSend = pendingConfig.current || (isReload ? lastConfig.current : null)

          if (configToSend) {
            console.log('[WebViewWorker] Sending config to WebView')
            webviewRef.current?.injectJavaScript(`
                window.postMessage(${JSON.stringify(richJson.stringify({ type: 'init', config: configToSend }))}, '*');
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
          console.log('[WebViewWorker] Received reload request from WebView, remounting...')
          isReadyRef.current = false
          setIsReady(false)
          setIsLoaded(false)
          // Use lastConfig so the re-initialized WebView picks up the same config
          pendingConfig.current = lastConfig.current
          setWebviewKey((k) => k + 1)
          break

        case 'system.ready':
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

  const devUrl = getDevServerUrl()

  // --- Build the WebView source per mode ---
  //
  // Dev:         Load inline HTML with file:/// base URL.
  //              Android requires file:// origin + allowUniversalAccessFromFileURLs
  //              for cross-origin fetch to work. iOS also uses this approach to
  //              avoid the WebView opening the dev server URL in Safari.
  //              We override location.reload() to post a message to RN,
  //              which remounts the WebView (re-fetching the latest bundle).
  //              The WebSocket URL fix is needed since the base is file:///.
  //
  // Production:  Inline HTML with the bundle code baked in.

  const getSource = () => {
    if (!__DEV__) {
      const prodCsp =
        "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; connect-src https:; frame-src 'none'; object-src 'none';"
      return {
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="Content-Security-Policy" content="${prodCsp}">
              <script>${securityPatches}</script>
            </head>
            <body>
              <script>
                try {
                  ${webviewBundle.code}
                } catch (err) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ctrl.error', payload: { ctrlName: 'GlobalCrash', errors: [{ message: err.toString(), stack: err.stack }] } }));
                }
              </script>
            </body>
          </html>
        `,
        baseUrl: 'file:///'
      }
    }

    // Dev mode: inline HTML with file:/// base URL + reload override
    const devCsp = `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' ${devUrl}; connect-src https: ${devUrl} ws: wss:; frame-src 'none'; object-src 'none';`
    return {
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="${devCsp}">
            <script>
              ${securityPatches}

              // Fix Webpack Dev Server WebSocket URL when baseUrl is file:///
              // and detect recompilation to trigger a RN-side WebView remount
              // (since location.reload() would navigate to file:/// which fails).
              var OriginalWebSocket = window.WebSocket;
              var _wdsLastHash = null;
              var _wdsPendingReload = false;
              window.WebSocket = function(url, protocols) {
                var connectUrl = url;
                if (url && (url.indexOf('ws:///') === 0 || url.indexOf('wss:///') === 0 || url.indexOf('0.0.0.0') > -1)) {
                  connectUrl = '${devUrl}'.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
                }
                var ws = protocols ? new OriginalWebSocket(connectUrl, protocols) : new OriginalWebSocket(connectUrl);

                // Listen for webpack-dev-server messages to detect recompilation.
                // Message flow: {"type":"hash","data":"<newHash>"} then {"type":"ok"}.
                // On first connect, we store the hash. On subsequent hash changes,
                // we flag a pending reload and trigger it when "ok" arrives.
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
            </script>
          </head>
          <body>
            <script src="${devUrl}/webview-bundle.js"></script>
          </body>
        </html>
      `,
      baseUrl: 'file:///'
    }
  }

  const source = getSource()

  return (
    <WebView
      key={webviewKey}
      ref={webviewRef}
      source={source}
      onMessage={handleMessage}
      onError={(syntheticEvent) => {
        if (__DEV__) {
          const { nativeEvent } = syntheticEvent
          console.warn('[WebViewWorker] WebView Error:', nativeEvent)
        }
      }}
      onHttpError={(syntheticEvent) => {
        if (__DEV__) {
          const { nativeEvent } = syntheticEvent
          console.warn('[WebViewWorker] WebView HTTP Error:', nativeEvent)
        }
      }}
      javaScriptEnabled={true}
      originWhitelist={__DEV__ ? ['file://*', `${devUrl}/*`] : ['file://*']}
      onShouldStartLoadWithRequest={(request) =>
        request.url.startsWith('file:///') || (__DEV__ && request.url.startsWith(devUrl))
      }
      mixedContentMode="always"
      allowFileAccessFromFileURLs={true}
      allowUniversalAccessFromFileURLs={true}
      domStorageEnabled={true}
      webviewDebuggingEnabled={__DEV__}
      style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
      containerStyle={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
      pointerEvents="none"
    />
  )
})
