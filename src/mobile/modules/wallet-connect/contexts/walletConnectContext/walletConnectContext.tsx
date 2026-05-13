import { PermissionResponse, useCameraPermissions } from 'expo-camera'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Linking } from 'react-native'

import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import {
  getPendingRestoreSessions,
  getWalletKit,
  initWalletConnect,
  isWalletConnectInitialized
} from '@mobile/modules/wallet-connect/services/walletConnectService'

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

  // Initialize WalletKit when dispatch is available
  useEffect(() => {
    // Already initialized (module-level flag) — nothing to do.
    if (isWalletConnectInitialized()) {
      setIsInitialized(true)
      return
    }

    const initWc = async () => {
      try {
        await initWalletConnect(dispatch)
        setIsInitialized(true)
      } catch (e) {
        console.error('[WalletConnectProvider] Initialization failed:', e)
      }
    }

    initWc()
  }, [dispatch])

  // Restore WC sessions once store is ready
  useEffect(() => {
    if (!isStoreReady || !isInitialized) return

    const sessionsToRestore = getPendingRestoreSessions()
    if (sessionsToRestore && sessionsToRestore.length > 0) {
      dispatch({
        type: 'RESTORE_WC_SESSIONS',
        params: { sessions: sessionsToRestore }
      })
    }
  }, [isStoreReady, isInitialized, dispatch])

  const pair = useCallback(
    async (uri: string) => {
      const walletKit = getWalletKit()
      if (!walletKit || !isInitialized) return

      try {
        await walletKit.pair({ uri })
      } catch (e) {
        console.error('WalletConnect pair failed:', e)
      }
    },
    [isInitialized]
  )

  useEffect(() => {
    if (!isInitialized) return

    const handleDeepLink = (event: { url: string }) => {
      if (event.url.startsWith('wc:')) {
        pair(event.url)
      } else if (event.url.includes('wc?uri=')) {
        const uri = event.url.split('wc?uri=')[1]
        if (uri) {
          pair(decodeURIComponent(uri))
        }
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
  }, [isInitialized, pair])

  return (
    <WalletConnectContext.Provider
      value={{ pair, isInitialized, cameraPermission, requestCameraPermission }}
    >
      {children}
    </WalletConnectContext.Provider>
  )
}
