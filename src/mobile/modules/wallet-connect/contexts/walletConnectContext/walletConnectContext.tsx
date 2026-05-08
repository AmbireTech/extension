import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Linking } from 'react-native'

import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import {
  getWalletKit,
  initWalletConnect
} from '@mobile/modules/wallet-connect/services/walletConnectService'

type WalletConnectContextValue = {
  pair: (uri: string) => Promise<void>
  isInitialized: boolean
}

export const WalletConnectContext = createContext<WalletConnectContextValue>({
  pair: async () => {},
  isInitialized: false
})

export const WalletConnectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { controllerStore } = useContext(ControllerStoreContext)
  const { dispatch } = useContext(ControllersMiddlewareContext)

  useEffect(() => {
    const initWc = async () => {
      // Make sure the controller store has mainCtrl ready
      if ((controllerStore as any).mainCtrl) {
        await initWalletConnect((controllerStore as any).mainCtrl, dispatch)
        setIsInitialized(true)
      }
    }

    initWc()
  }, [controllerStore, dispatch])

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
    <WalletConnectContext.Provider value={{ pair, isInitialized }}>
      {children}
    </WalletConnectContext.Provider>
  )
}
