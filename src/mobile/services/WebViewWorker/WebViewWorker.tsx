import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { pbkdf2Sync, scrypt } from 'react-native-quick-crypto'
import { WebView } from 'react-native-webview'

import * as richJson from '@ambire-common/libs/richJson/richJson'
import eventBus from '@common/services/event/eventBus'
import { storage } from '@common/services/storage'

// In production, the bundle is inlined via the JSON import.
// In dev, we load from webpack-dev-server so this import is unused.
// @ts-ignore
const webviewBundle = __DEV__ ? null : require('./webview-bundle.json')

// The dev server URL for webpack-dev-server.
// - iOS Simulator: localhost works directly
// - Android Emulator: 10.0.2.2 maps to host machine's localhost
// - Physical device: replace with your machine's LAN IP
const WEBVIEW_DEV_SERVER_PORT = 8082
const getDevServerUrl = () => {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${WEBVIEW_DEV_SERVER_PORT}`
  }
  return `http://localhost:${WEBVIEW_DEV_SERVER_PORT}`
}

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

  useImperativeHandle(ref, () => ({
    dispatch: (action: any) => {
      if (!isReadyRef.current) {
        console.warn('[Native] WebViewWorker NOT READY. Dropping action:', action.type)
        return
      }
      const payload = richJson.stringify({ type: 'dispatchAction', action })
      console.log('[Native] dispatch() calling injectJavaScript for:', action.type)
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
        window.postMessage(${JSON.stringify(richJson.stringify({ type: 'response', id, result, error: error?.message || error }))}, '*');
        true;
      `)
  }

  // In dev mode, load from webpack-dev-server for HMR.
  // In production, inline the bundle into HTML.
  if (__DEV__) {
    const devUrl = getDevServerUrl()
    console.log(`[WebViewWorker] DEV mode — loading from ${devUrl}`)

    return (
      <WebView
        ref={webviewRef}
        source={{ uri: devUrl }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent
          console.warn('[WebViewWorker] WebView Error:', nativeEvent)
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent
          console.warn('[WebViewWorker] WebView HTTP Error:', nativeEvent)
        }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        originWhitelist={['*']}
        // Allow loading from http:// in dev
        mixedContentMode="always"
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
        containerStyle={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
        pointerEvents="none"
      />
    )
  }

  const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script>
            window.onerror = function(msg, url, lineNo, columnNo, error) {
              var errMessage = error ? error.stack || error.message : msg;
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ctrl.error', payload: { ctrlName: 'Global', errors: [{ message: errMessage, url, lineNo }] } }));
              return false;
            };
          </script>
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
    `

  return (
    <WebView
      ref={webviewRef}
      source={{ html: htmlContent, baseUrl: 'ambire://' }}
      onMessage={handleMessage}
      javaScriptEnabled={true}
      originWhitelist={['*']}
      style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
      containerStyle={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
      pointerEvents="none"
    />
  )
})
