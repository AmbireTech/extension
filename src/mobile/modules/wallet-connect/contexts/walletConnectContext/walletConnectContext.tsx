import { PermissionResponse, useCameraPermissions } from 'expo-camera'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AppState, Linking } from 'react-native'

import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import useToast from '@common/hooks/useToast'
import {
  getPendingRestoreSessions,
  getWalletKit,
  initWalletConnect,
  isWalletConnectInitialized,
  reconnectWalletConnectIfNeeded
} from '@mobile/modules/wallet-connect/services/walletConnectService'

const PAIR_TIMEOUT = 20000

type WalletConnectContextValue = {
  pair: (uri: string) => Promise<void>
  isInitialized: boolean
  cameraPermission: PermissionResponse | null
  requestCameraPermission: () => Promise<PermissionResponse>
}

export const WalletConnectContext = createContext<WalletConnectContextValue>({
  pair: async () => {},
  isInitialized: false,
  cameraPermission: null,
  requestCameraPermission: async () => ({}) as PermissionResponse
})

export const WalletConnectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Seed from the module-level flag so remounts (e.g. hot reload) don't
  // incorrectly start as false when WalletKit is already initialized.
  const [isInitialized, setIsInitialized] = useState(isWalletConnectInitialized)
  const { dispatch } = useContext(ControllersMiddlewareContext)
  const { isStoreReady } = useContext(ControllerStoreContext)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()
  const { addToast } = useToast()

  // Initialize WalletKit when store and dispatch are ready
  useEffect(() => {
    if (!isStoreReady) return

    // Already initialized (module-level flag) — nothing to do.
    if (isWalletConnectInitialized()) {
      setIsInitialized(true)
      return
    }

    const initWc = async () => {
      try {
        await initWalletConnect(dispatch, addToast)
        setIsInitialized(true)
      } catch (e) {
        console.error('[WalletConnectProvider] Initialization failed:', e)
      }
    }

    initWc()
  }, [dispatch, isStoreReady])

  // Restore WC sessions once store is ready
  useEffect(() => {
    if (!isStoreReady || !isInitialized) return

    const sessionsToRestore = getPendingRestoreSessions()
    if (sessionsToRestore && sessionsToRestore.length > 0) {
      dispatch(
        {
          type: 'RESTORE_WC_SESSIONS',
          params: { sessions: sessionsToRestore }
        },
        undefined,
        true
      )
    }
  }, [isStoreReady, isInitialized, dispatch])

  // The relay socket dies while the app is suspended and the SDK doesn't always recover.
  useEffect(() => {
    if (!isInitialized) return

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void reconnectWalletConnectIfNeeded()
    })

    return () => subscription.remove()
  }, [isInitialized])

  const pair = useCallback(
    async (uri: string) => {
      const walletKit = getWalletKit()
      if (!walletKit || !isInitialized) return

      let pairTimeout: ReturnType<typeof setTimeout> | undefined

      try {
        await reconnectWalletConnectIfNeeded()
        // Pairing over a dead socket never settles, so the scan looks like a no-op.
        await Promise.race([
          walletKit.pair({ uri }),
          new Promise((_, reject) => {
            pairTimeout = setTimeout(() => reject(new Error('Pairing timed out')), PAIR_TIMEOUT)
          })
        ])
      } catch (e: any) {
        // "Pairing already exists" is expected on Android when the OS fires the
        // deep link event twice (once on intent, once on focus restore). WalletKit
        // checks its internal pairing store and throws — silently ignore it.
        if (e?.message?.includes('Pairing already exists')) return
        console.error('WalletConnect pair failed:', e)
        addToast('Could not connect to the app. Check your internet connection and try again.', {
          type: 'error'
        })
      } finally {
        clearTimeout(pairTimeout)
      }
    },
    [isInitialized, addToast]
  )

  useEffect(() => {
    if (!isInitialized) return

    const handleDeepLink = (event: { url: string }) => {
      if (event.url.startsWith('wc:')) {
        // Raw WC pairing URI — e.g. from a mobile browser "Connect Wallet" flow
        pair(event.url)
      } else if (event.url.includes('wc?uri=')) {
        // Wrapped pairing URI — e.g. ambire://wc?uri=wc%3A… from another app
        const uri = event.url.split('wc?uri=')[1]
        if (uri) {
          pair(decodeURIComponent(uri))
        }
      } else if (event.url === 'ambire://wc' || event.url.startsWith('ambire://wc?')) {
        // Redirect-back from dapp — active session exists, dapp hands control back for pending signing request
        addToast('Opening WalletConnect request…', { timeout: 2500 })
      }
    }

    const subscription = Linking.addEventListener('url', handleDeepLink)

    // Check initial URL just in case
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url })
      }
    })

    return () => {
      subscription.remove()
    }
  }, [isInitialized, pair, addToast])

  return (
    <WalletConnectContext.Provider
      value={{ pair, isInitialized, cameraPermission, requestCameraPermission }}
    >
      {children}
    </WalletConnectContext.Provider>
  )
}
