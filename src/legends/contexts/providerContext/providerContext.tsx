import { ethers } from 'ethers'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { EthereumProvider } from '@web/extension-services/inpage/EthereumProvider'

type ProviderContextType = {
  provider: EthereumProvider | null
  browserProvider: ethers.BrowserProvider | null
  isConnected: boolean
  hasAnyAmbireExtensionInstalled: boolean
  connectProvider: () => Promise<void>
  disconnectProvider: () => void
}

const ProviderContext = createContext<ProviderContextType>({} as ProviderContextType)

type WalletType = 'ambire' | 'ambire-next'

type EIP6963ProviderInfo = {
  uuid: string
  name: string
  icon: string
  rdns: string
}

type EIP6963AnnounceProviderEvent = {
  detail: EIP6963ProviderDetails
}

type EIP6963ProviderDetails = {
  info: EIP6963ProviderInfo
  provider: EthereumProvider
}

const LOCAL_STORAGE_CONNECTED_WALLET = 'connectedWallet'

const ProviderContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [providers, setProviders] = useState<Record<WalletType, EIP6963ProviderDetails>>(
    {} as Record<WalletType, EIP6963ProviderDetails>
  )
  const [provider, setProvider] = useState<EthereumProvider | null>(null)
  const [browserProvider, setBrowserProvider] = useState<ethers.BrowserProvider | null>(null)
  const [connectedWallet, setConnectedWallet] = useState<WalletType | null>(
    (localStorage.getItem(LOCAL_STORAGE_CONNECTED_WALLET) as WalletType) || null
  )

  useEffect(() => {
    const detected: Record<WalletType, EIP6963ProviderDetails> = {} as Record<
      WalletType,
      EIP6963ProviderDetails
    >

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
      if (connectedWallet && !provider) {
        const detectedProvider = providers[connectedWallet]

        if (detectedProvider) {
          const accs = await detectedProvider.provider.request({
            method: 'eth_requestAccounts',
            params: []
          })
          if (accs) {
            setProvider(detectedProvider.provider)
            setBrowserProvider(new ethers.BrowserProvider(detectedProvider.provider))
          }
        }
      }
    })()
  }, [connectedWallet, provider, providers])

  const openModal = useCallback(() => {
    console.log('open modal to select wallet')
  }, [])

  const connectProvider = useCallback(async () => {
    if (provider) return

    const detectedProvidersCount = Object.keys(providers).length
    if (!detectedProvidersCount) {
      openModal()
    }

    if (detectedProvidersCount === 1) {
      const key = Object.keys(providers)[0] as WalletType
      const detectedProvider = providers[key]
      const accs = await detectedProvider.provider.request({
        method: 'eth_requestAccounts',
        params: []
      })
      if (accs) {
        setProvider(detectedProvider.provider)
        setBrowserProvider(new ethers.BrowserProvider(detectedProvider.provider))
        setConnectedWallet(key)
        localStorage.setItem(LOCAL_STORAGE_CONNECTED_WALLET, key)
      }
    }

    if (detectedProvidersCount > 1) {
      openModal()
    }
  }, [providers, openModal, provider])

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
    [provider, browserProvider, providers, connectedWallet, connectProvider, disconnectProvider]
  )

  return <ProviderContext.Provider value={contextValue}>{children}</ProviderContext.Provider>
}

export { ProviderContextProvider, ProviderContext }
