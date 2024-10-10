import React, { createContext, useCallback, useEffect, useMemo } from 'react'

import { getIdentity } from '@ambire-common/libs/accountAdder/accountAdder'
import { RELAYER_URL } from '@env'

const accountContext = createContext<{
  connectedAccount: string | null
  chainId: bigint | null
  isLoading: boolean
  error: string | null
  requestAccounts: () => void
  disconnectAccount: () => void
}>({
  connectedAccount: null,
  chainId: null,
  isLoading: true,
  error: null,
  requestAccounts: () => {},
  disconnectAccount: () => {}
})

const AccountContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [connectedAccount, setConnectedAccount] = React.useState<string | null>(null)
  const [chainId, setChainId] = React.useState<bigint | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const requestAccounts = useCallback(async () => {
    if (!window.ambire) return
    await window.ambire.request({
      method: 'eth_requestAccounts',
      params: []
    })
  }, [])

  const disconnectAccount = useCallback(() => {
    alert('TODO: disconnect logic')
    // TODO: disconnect logic
  }, [])

  const getConnectedAccount = useCallback(async (): Promise<string | null> => {
    if (!window.ambire) return null
    const accounts = await window.ambire.request({
      method: 'eth_accounts',
      params: []
    })

    // @ts-ignore
    return accounts[0]
  }, [])

  const getChainId = useCallback(async (): Promise<bigint | null> => {
    if (!window.ambire) return null

    const connectedOnChainId = await window.ambire.request({
      method: 'eth_chainId',
      params: []
    })

    if (typeof connectedOnChainId !== 'string') return null

    return BigInt(connectedOnChainId)
  }, [])

  const validateAndSetAccount = useCallback(async (address: string) => {
    const identity = await getIdentity(address, fetch as any, RELAYER_URL)

    if (!identity.creation) {
      setConnectedAccount(null)
      setError('You are trying to connect a non Ambire v2 account. Please switch your account!')
      return
    }

    setError(null)
    setConnectedAccount(address)
  }, [])

  useEffect(() => {
    getChainId()
      .then((newChainId) => {
        if (newChainId) setChainId(newChainId)
      })
      .catch((e) => console.error('Error fetching chainId', e))

    const onChainChanged = (newChainId: string) => setChainId(BigInt(newChainId))

    window.ambire?.on('chainChanged', onChainChanged)

    return () => {
      window.ambire.removeListener('chainChanged', onChainChanged)
    }
  }, [getChainId])

  // On Account connect or change set the new Legends address and fetch its portfolio,
  // while on Account disconnect, we simply reload the Legends, which resets all the hooks state.
  useEffect(() => {
    const onAccountsChanged = async (accounts: string[]) => {
      await validateAndSetAccount(accounts[0])
      setIsLoading(false)
    }

    getConnectedAccount()
      .then(async (account) => {
        if (!account) return

        await validateAndSetAccount(account)
        setIsLoading(false)
      })
      .catch(() => console.error('Error fetching connected account'))

    // The `accountsChanged` event is fired when the account is connected, changed or disconnected by the extension.
    window.ambire?.on('accountsChanged', onAccountsChanged)
    window.ambire?.on('chainChanged', (newChainId: string) => setChainId(BigInt(newChainId)))

    return () => {
      window.ambire.removeListener('accountsChanged', onAccountsChanged)
    }
  }, [getConnectedAccount, validateAndSetAccount])

  const contextValue = useMemo(
    () => ({
      connectedAccount,
      error,
      requestAccounts,
      disconnectAccount,
      chainId,
      isLoading
    }),
    [connectedAccount, error, requestAccounts, disconnectAccount, chainId, isLoading]
  )

  return <accountContext.Provider value={contextValue}>{children}</accountContext.Provider>
}

export { AccountContextProvider, accountContext }
