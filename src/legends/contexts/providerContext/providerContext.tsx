import { ethers } from 'ethers'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import Spinner from '@legends/components/Spinner'
import { EthereumProvider } from '@web/extension-services/inpage/EthereumProvider'

import SelectProviderModal from './SelectProviderModal'
import { EIP6963AnnounceProviderEvent, Providers, WalletType } from './types'

type ProviderContextType = {
  provider: EthereumProvider | null
  browserProvider: ethers.BrowserProvider | null
  isConnected: boolean
  hasAnyAmbireExtensionInstalled: boolean
  connectProvider: () => Promise<void>
  disconnectProvider: () => void
}

const ProviderContext = createContext<ProviderContextType>({} as ProviderContextType)

const LOCAL_STORAGE_CONNECTED_WALLET = 'connectedWallet'

const ProviderContextProvider = ({ children }: { children: React.ReactNode }) => {
  const selectProviderTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const [providers, setProviders] = useState<Providers>({} as Providers)
  const [provider, setProvider] = useState<EthereumProvider | null>(null)
  const [browserProvider, setBrowserProvider] = useState<ethers.BrowserProvider | null>(null)
  const [connectedWallet, setConnectedWallet] = useState<WalletType | null>(
    (localStorage.getItem(LOCAL_STORAGE_CONNECTED_WALLET) as WalletType) || null
  )
  const [isInitialLoadingDone, setIsInitialLoadingDone] = useState(false)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)

  /**
   * Automatically selects the last connected provider if it's available.
   * If both Ambire versions are installed, and one of them injects slightly faster,
   * we wait for 500ms to see if the other one gets announced as well.
   */
  const autoSelectProvider = useCallback(
    (latestProviders: Providers) => {
      if (!connectedWallet) {
        setIsInitialLoadingDone(true)
        return
      }

      if (selectProviderTimeoutRef.current) {
        clearTimeout(selectProviderTimeoutRef.current)
      }

      const hasBothProviders = Object.keys(latestProviders).length > 1

      selectProviderTimeoutRef.current = setTimeout(
        () => {
          const detectedProvider = latestProviders[connectedWallet]

          // Previously connected wallet is not installed anymore
          if (!detectedProvider) {
            setIsInitialLoadingDone(true)
            return
          }

          setProvider(detectedProvider.provider)
          setBrowserProvider(new ethers.BrowserProvider(detectedProvider.provider))
          setIsInitialLoadingDone(true)
        },
        // Give 500ms for the next provider to be announced
        hasBothProviders ? 0 : 500
      )
    },
    [connectedWallet]
  )

  useEffect(() => {
    // The window objects are injected immediately. If they are not present
    // we are sure that no Ambire extension is installed
    if (!window.ambire && !window.ambireNext) {
      setIsInitialLoadingDone(true)
      return
    }

    // If either window object is injected, we wait for the EIP-6963 announcements
    const detected: Providers = {} as Providers

    const handler = (event: CustomEvent<EIP6963AnnounceProviderEvent['detail']>) => {
      const { detail } = event

      if (detail.info.rdns === 'com.ambire.wallet') {
        detected.ambire = detail
      }
      if (detail.info.rdns === 'com.ambire-next.wallet') {
        detected['ambire-next'] = detail
      }

      setProviders((p) => {
        const updated = { ...p, ...detected }

        autoSelectProvider(updated)

        return updated
      })
    }

    window.addEventListener('eip6963:announceProvider', handler as any)
    window.dispatchEvent(new Event('eip6963:requestProvider'))

    return () => {
      window.removeEventListener('eip6963:announceProvider', handler as any)
    }
  }, [autoSelectProvider])

  const openModal = useCallback(() => {
    setIsConnectModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsConnectModalOpen(false)
  }, [])

  const selectProvider = useCallback(
    async (walletId: WalletType, shouldCloseModal?: boolean) => {
      try {
        const detectedProvider = providers[walletId]
        const accs: any = await detectedProvider.provider.request({
          method: 'eth_requestAccounts',
          params: []
        })

        if (accs && accs.length > 0) {
          setProvider(detectedProvider.provider)
          setBrowserProvider(new ethers.BrowserProvider(detectedProvider.provider))
          setConnectedWallet(walletId)
          localStorage.setItem(LOCAL_STORAGE_CONNECTED_WALLET, walletId)
        }

        if (shouldCloseModal) {
          closeModal()
        }
      } catch (e: any) {
        console.error('Error selecting provider:', e)
      }
    },
    [closeModal, providers]
  )

  const connectProvider = useCallback(async () => {
    const detectedProvidersCount = Object.keys(providers).length

    if (!detectedProvidersCount) {
      openModal()
    } else if (detectedProvidersCount === 1) {
      await selectProvider(Object.keys(providers)[0] as WalletType)
    } else if (detectedProvidersCount > 1) {
      // Always prefer the previously connected wallet if available
      if (connectedWallet && providers[connectedWallet]) {
        await selectProvider(connectedWallet)
        return
      }
      openModal()
    }
  }, [providers, openModal, selectProvider, connectedWallet])

  const disconnectProvider = useCallback(() => {
    setProvider(null)
    setBrowserProvider(null)
    setConnectedWallet(null)
    localStorage.removeItem(LOCAL_STORAGE_CONNECTED_WALLET)
  }, [])

  const contextValue: ProviderContextType = useMemo(
    () => ({
      provider,
      browserProvider,
      isConnected: !!connectedWallet && !!provider,
      hasAnyAmbireExtensionInstalled: !!Object.keys(providers).length,
      connectProvider,
      disconnectProvider
    }),
    [provider, browserProvider, connectedWallet, providers, connectProvider, disconnectProvider]
  )

  return (
    <ProviderContext.Provider value={contextValue}>
      {isInitialLoadingDone ? children : <Spinner isCentered />}
      <SelectProviderModal
        isConnectModalOpen={isConnectModalOpen}
        setIsConnectModalOpen={setIsConnectModalOpen}
        providers={providers}
        selectProvider={selectProvider}
      />
    </ProviderContext.Provider>
  )
}

export { ProviderContextProvider, ProviderContext }
