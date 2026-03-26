import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { WebView } from 'react-native-webview'
import { storage } from '@common/services/storage'
import * as richJson from '@ambire-common/libs/richJson/richJson'
import eventBus from '@common/services/event/eventBus'

// @ts-ignore
import webviewBundle from './webview-bundle.json'

export interface WebViewWorkerRef {
  dispatch: (action: any) => void
  init: (config: any) => Promise<string[]>
}

export const WebViewWorker = forwardRef<WebViewWorkerRef, {}>(
  (_, ref) => {
    const webviewRef = useRef<WebView>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [isReady, setIsReady] = useState(false)
    const initResolver = useRef<((ctrls: string[]) => void) | null>(null)
    const pendingConfig = useRef<any>(null)

    useImperativeHandle(ref, () => ({
      dispatch: (action: any) => {
        if (!isReady) {
          console.warn('WebViewWorker not ready to dispatch actions yet.')
          return
        }
        webviewRef.current?.injectJavaScript(`
          window.postMessage(${JSON.stringify(richJson.stringify({ type: 'dispatchAction', action }))}, '*');
          true;
        `)
      },
      init: (config: any) => {
        console.log('[WebViewWorker] init called', { isLoaded, config })
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
        
        console.log(`[WebViewWorker] Received message from WebView: ${data.type}`, data.payload)
        
        switch (data.type) {
          case 'system.loaded':
            console.log('[WebViewWorker] WebView internal script loaded')
            setIsLoaded(true)
            if (pendingConfig.current) {
              console.log('[WebViewWorker] Sending buffered config to WebView')
              webviewRef.current?.injectJavaScript(`
                window.postMessage(${JSON.stringify(richJson.stringify({ type: 'init', config: pendingConfig.current }))}, '*');
                true;
              `)
              pendingConfig.current = null
            }
            break

          case 'system.ready':
            console.log('[WebViewWorker] WebView controllers ready', data.payload.controllers)
            setIsReady(true)
            if (initResolver.current) {
              initResolver.current(data.payload.controllers)
              initResolver.current = null
            }
            break
            
          case 'ctrl.update':
            eventBus.emit('ctrlUpdate', {
              ctrlName: data.payload.ctrlName,
              ctrlState: data.payload.state
            })
            break
            
          case 'ctrl.error':
            eventBus.emit('error', { errors: data.payload.errors, controller: data.payload.ctrlName })
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
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        style={{ width: 0, height: 0, opacity: 0 }}
        containerStyle={{ width: 0, height: 0, opacity: 0 }}
      />
    )
  }
)
