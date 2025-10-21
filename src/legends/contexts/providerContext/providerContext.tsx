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
  const [providers, setProviders] = useState<Providers>({} as Providers)
  const [provider, setProvider] = useState<EthereumProvider | null>(null)
  const [browserProvider, setBrowserProvider] = useState<ethers.BrowserProvider | null>(null)
  const [connectedWallet, setConnectedWallet] = useState<WalletType | null>(
    (localStorage.getItem(LOCAL_STORAGE_CONNECTED_WALLET) as WalletType) || null
  )
  const [isInitialLoadingDone, setIsInitialLoadingDone] = useState(false)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)

  useEffect(() => {
    const detected: Providers = {} as Providers

    const handler = (event: CustomEvent<EIP6963AnnounceProviderEvent['detail']>) => {
      const { detail } = event

      if (detail.info.rdns === 'com.ambire.wallet') {
        detected.ambire = detail
      }
      if (detail.info.rdns === 'com.ambire-next.wallet') {
        detected['ambire-next'] = detail
      }

      setProviders((p) => ({ ...p, ...detected }))
    }

    window.addEventListener('eip6963:announceProvider', handler as any)
    window.dispatchEvent(new Event('eip6963:requestProvider'))

    return () => {
      window.removeEventListener('eip6963:announceProvider', handler as any)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      // Not installed, already done or no past connection
      if ((!window.ambire && !window.ambireNext) || isInitialLoadingDone || !connectedWallet) {
        setIsInitialLoadingDone(true)
        return
      }

      // Waiting for the providers to be detected
      if (Object.keys(providers).length === 0) return

      const detectedProvider = providers[connectedWallet]

      // Previously connected wallet is not installed anymore
      if (!detectedProvider) {
        setIsInitialLoadingDone(true)
        return
      }

      const accs: any = await detectedProvider.provider.request({
        // Purposefuly using eth_accounts to avoid popup on reconnect
        method: 'eth_accounts',
        params: []
      })

      // Auto-connect only if the wallet hasn't disconnected manually
      if (accs && accs.length > 0) {
        setProvider(detectedProvider.provider)
        setBrowserProvider(new ethers.BrowserProvider(detectedProvider.provider))
      }

      setIsInitialLoadingDone(true)
    })()
  }, [connectedWallet, isInitialLoadingDone, provider, providers])

  const openModal = useCallback(() => {
    setIsConnectModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsConnectModalOpen(false)
  }, [])

  const selectProvider = useCallback(
    async (walletId: WalletType, shouldCloseModal?: boolean) => {
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
    },
    [closeModal, providers]
  )

  const connectProvider = useCallback(async () => {
    if (provider) return

    const detectedProvidersCount = Object.keys(providers).length

    if (!detectedProvidersCount) {
      openModal()
    } else if (detectedProvidersCount === 1) {
      await selectProvider(Object.keys(providers)[0] as WalletType)
    } else if (detectedProvidersCount > 1) {
      openModal()
    }
  }, [provider, providers, openModal, selectProvider])

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
