import React, { createContext, useCallback, useEffect, useMemo } from 'react'

import { AccountIdentityResponse } from '@ambire-common/interfaces/account'
import { isAmbireV1LinkedAccount } from '@ambire-common/libs/account/account'
import { normalizeIdentityResponse } from '@ambire-common/libs/accountPicker/accountPicker'
import { relayerCall } from '@ambire-common/libs/relayerCall/relayerCall'
import { RELAYER_URL } from '@env'
import useProviderContext from '@legends/hooks/useProviderContext'
import useToast from '@legends/hooks/useToast'

type AccountContextType = {
  connectedAccount: string | null
  v1Account: string | null
  allAccounts: string[]
  chainId: bigint | null
  isLoading: boolean
  error: string | null
}

const accountContext = createContext<AccountContextType>({} as AccountContextType)

const LOCAL_STORAGE_ACC_KEY = 'connectedAccount'

const AccountContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { addToast } = useToast()
  const { isConnected, provider } = useProviderContext()

  // We keep only V2 accounts
  const [connectedAccount, setConnectedAccount] = React.useState<string | null>(() => {
    const storedAccount = localStorage.getItem(LOCAL_STORAGE_ACC_KEY)

    if (!isConnected) return null

    return storedAccount || null
  })

  const [allAccounts, setAllAccounts] = React.useState<string[]>([])
  const [v1Account, setV1Account] = React.useState<string | null>(null)
  const [chainId, setChainId] = React.useState<bigint | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const getConnectedAccount = useCallback(async (): Promise<string | null> => {
    if (!provider) return null

    const accounts = await provider.request({ method: 'eth_accounts', params: [] })
    setAllAccounts(accounts as string[])

    // @ts-ignore
    return accounts[0]
  }, [provider])

  const getChainId = useCallback(async (): Promise<bigint | null> => {
    if (!provider) return null

    const connectedOnChainId = await provider.request({
      method: 'eth_chainId',
      params: []
    })

    if (typeof connectedOnChainId !== 'string') return null

    return BigInt(connectedOnChainId)
  }, [provider])

  const validateAndSetAccount = useCallback(
    async (address: string) => {
      try {
        // Add: timeout to this request
        // @ts-ignore types mismatch a bit with the extension, which is fine
        const callRelayer = relayerCall.bind({ url: RELAYER_URL, fetch })
        const identityRes: AccountIdentityResponse | null = await callRelayer(
          `/v2/identity/${address}`
        ).catch((err: any) => {
          // 404 response (if the account is not found) is a valid response, do not throw
          if (err?.output?.res?.status === 404) return null

          throw err
        })

        const identity = normalizeIdentityResponse(address, identityRes)
        const factoryAddr = identity.creation?.factoryAddr
        const isV1 = isAmbireV1LinkedAccount(factoryAddr)

        if (isV1) {
          setV1Account(address)
          setConnectedAccount(null)
          localStorage.setItem(LOCAL_STORAGE_ACC_KEY, '')

          setError('You are trying to connect an Ambire v1 account. Please switch your account!')
        } else {
          setError(null)
          setV1Account(null)
          setConnectedAccount(address)
          localStorage.setItem(LOCAL_STORAGE_ACC_KEY, address)
        }
      } catch (e: any) {
        addToast(
          "We are experiencing a back-end outage and couldn't validate the connected account's identity. Please reload the page, and if the problem persists, contact support.",
          { type: 'error' }
        )
        console.log(e)
      }
    },
    [addToast]
  )

  const handleDisconnectFromWallet = useCallback(() => {
    setConnectedAccount(null)
    setV1Account(null)
    setIsLoading(false)
    setAllAccounts([])
    localStorage.removeItem(LOCAL_STORAGE_ACC_KEY)
  }, [])

  useEffect(() => {
    if (!isConnected && connectedAccount) {
      handleDisconnectFromWallet()
    }
  }, [connectedAccount, handleDisconnectFromWallet, isConnected])

  useEffect(() => {
    if (!provider) return
    getChainId()
      .then((newChainId) => {
        if (newChainId) setChainId(newChainId)
      })
      .catch((e) => console.error('Error fetching chainId', e))

    const onChainChanged = (newChainId: string) => setChainId(BigInt(newChainId))

    provider.on('chainChanged', onChainChanged)

    return () => {
      provider.removeListener('chainChanged', onChainChanged)
    }
  }, [getChainId, provider])

  // On Account connect or change set the new Legends address and fetch its portfolio,
  // while on Account disconnect, we simply reload the Legends, which resets all the hooks state.
  useEffect(() => {
    if (!provider) return

    const onAccountsChanged = async (accounts: string[]) => {
      setIsLoading(true)
      if (!accounts.length) {
        handleDisconnectFromWallet()
        setIsLoading(false)
        return
      }

      await validateAndSetAccount(accounts[0]!)
      setIsLoading(false)
    }

    getConnectedAccount()
      .then(async (account) => {
        if (!account) {
          handleDisconnectFromWallet()
          return
        }

        await validateAndSetAccount(account)
        setIsLoading(false)
      })
      .catch(() => console.error('Error fetching connected account'))

    // The `accountsChanged` event is fired when the account is connected, changed or disconnected by the extension.
    provider.on('accountsChanged', onAccountsChanged)

    return () => {
      provider.removeListener('accountsChanged', onAccountsChanged)
    }
  }, [provider, getConnectedAccount, handleDisconnectFromWallet, validateAndSetAccount])

  const contextValue: AccountContextType = useMemo(
    () => ({
      connectedAccount,
      v1Account,
      error,
      allAccounts,
      chainId,
      isLoading
    }),
    [connectedAccount, v1Account, allAccounts, error, chainId, isLoading]
  )

  return <accountContext.Provider value={contextValue}>{children}</accountContext.Provider>
}

export { AccountContextProvider, accountContext }
