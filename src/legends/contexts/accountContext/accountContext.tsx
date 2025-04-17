import React, { createContext, useCallback, useEffect, useMemo } from 'react'

import { AMBIRE_ACCOUNT_FACTORY } from '@ambire-common/consts/deploy'
import { isAmbireV1LinkedAccount } from '@ambire-common/libs/account/account'
import { getIdentity } from '@ambire-common/libs/accountPicker/accountPicker'
import { RELAYER_URL } from '@env'
import useToast from '@legends/hooks/useToast'

type AccountContextType = {
  connectedAccount: string | null
  nonV2Account: string | null
  allAccounts: string[]
  allowNonV2Connection: boolean
  setAllowNonV2Connection: (arg: boolean) => void
  chainId: bigint | null
  isLoading: boolean
  error: string | null
  requestAccounts: () => void
  disconnectAccount: () => void
}

const accountContext = createContext<AccountContextType>({} as AccountContextType)

const LOCAL_STORAGE_ACC_KEY = 'connectedAccount'
const LOCAL_STORAGE_IS_DISCONNECTED = 'isDisconnected'

const AccountContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { addToast } = useToast()
  const [isDisconnected, setIsDisconnected] = React.useState<boolean>(() => {
    const isDappDisconnected = localStorage.getItem(LOCAL_STORAGE_IS_DISCONNECTED)

    return isDappDisconnected === 'true'
  })
  // We keep only V2 accounts
  const [connectedAccount, setConnectedAccount] = React.useState<string | null>(() => {
    const storedAccount = localStorage.getItem(LOCAL_STORAGE_ACC_KEY)

    if (!window.ambire) return null

    return storedAccount || null
  })

  const [allAccounts, setAllAccounts] = React.useState<string[]>([])
  const [nonV2Account, setNonV2Account] = React.useState<string | null>(null)
  const [allowNonV2Connection, setAllowNonV2Connection] = React.useState<boolean>(false)
  const [chainId, setChainId] = React.useState<bigint | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const requestAccounts = useCallback(async () => {
    if (!window.ambire) return

    if (isDisconnected) {
      setIsDisconnected(false)
      localStorage.setItem(LOCAL_STORAGE_IS_DISCONNECTED, 'false')
    }
    await window.ambire.request({
      method: 'eth_requestAccounts',
      params: []
    })
  }, [isDisconnected])

  const getConnectedAccount = useCallback(async (): Promise<string | null> => {
    if (!window.ambire || isDisconnected) return null

    const accounts = await window.ambire.request({
      method: 'eth_accounts',
      params: []
    })
    setAllAccounts(accounts as string[])

    // @ts-ignore
    return accounts[0]
  }, [isDisconnected])

  const getChainId = useCallback(async (): Promise<bigint | null> => {
    if (!window.ambire) return null

    const connectedOnChainId = await window.ambire.request({
      method: 'eth_chainId',
      params: []
    })

    if (typeof connectedOnChainId !== 'string') return null

    return BigInt(connectedOnChainId)
  }, [])

  const validateAndSetAccount = useCallback(
    async (address: string) => {
      try {
        // Add: timeout to this request
        const identity = await getIdentity(address, fetch as any, RELAYER_URL)
        const factoryAddr = identity.creation?.factoryAddr
        const isV2 = factoryAddr === AMBIRE_ACCOUNT_FACTORY

        if (isV2) {
          setError(null)
          setNonV2Account(null)
          setConnectedAccount(address)
          localStorage.setItem(LOCAL_STORAGE_ACC_KEY, address)
          return
        }

        if (!allowNonV2Connection) {
          setConnectedAccount(null)
          localStorage.setItem(LOCAL_STORAGE_ACC_KEY, null)
        }

        setNonV2Account(address)

        if (!connectedAccount) {
          const isV1 = isAmbireV1LinkedAccount(factoryAddr)

          if (isV1) {
            setError('You are trying to connect an Ambire v1 account. Please switch your account!')
          } else {
            setError(
              'You are trying to connect a non Ambire v2 account. Please switch your account!'
            )
          }

          return
        }
      } catch (e: any) {
        addToast(
          "We are experiencing a back-end outage and couldn't validate the connected account's identity. Please reload the page, and if the problem persists, contact support.",
          { type: 'error' }
        )
        console.log(e)
      }
    },
    [addToast, connectedAccount]
  )

  const handleDisconnectFromWallet = useCallback(async () => {
    setConnectedAccount(null)
    setNonV2Account(null)
    setIsLoading(false)
    setAllAccounts([])
    localStorage.removeItem(LOCAL_STORAGE_ACC_KEY)
  }, [])

  const disconnectAccount = useCallback(async () => {
    setIsDisconnected(true)
    localStorage.setItem(LOCAL_STORAGE_IS_DISCONNECTED, 'true')
    handleDisconnectFromWallet()
  }, [handleDisconnectFromWallet])

  useEffect(() => {
    getChainId()
      .then((newChainId) => {
        if (newChainId) setChainId(newChainId)
      })
      .catch((e) => console.error('Error fetching chainId', e))

    const onChainChanged = (newChainId: string) => setChainId(BigInt(newChainId))

    window.ambire?.on('chainChanged', onChainChanged)

    return () => {
      window.ambire?.removeListener('chainChanged', onChainChanged)
    }
  }, [getChainId])

  // On Account connect or change set the new Legends address and fetch its portfolio,
  // while on Account disconnect, we simply reload the Legends, which resets all the hooks state.
  useEffect(() => {
    const onAccountsChanged = async (accounts: string[]) => {
      if (!accounts.length) {
        handleDisconnectFromWallet()
        return
      }

      await validateAndSetAccount(accounts[0])
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
    window.ambire?.on('accountsChanged', onAccountsChanged)

    return () => {
      window.ambire?.removeListener('accountsChanged', onAccountsChanged)
    }
  }, [getConnectedAccount, handleDisconnectFromWallet, validateAndSetAccount])

  const contextValue: AccountContextType = useMemo(
    () => ({
      connectedAccount,
      nonV2Account,
      allowNonV2Connection,
      setAllowNonV2Connection,
      error,
      requestAccounts,
      disconnectAccount,
      allAccounts,
      chainId,
      isLoading
    }),
    [
      connectedAccount,
      nonV2Account,
      allowNonV2Connection,
      setAllowNonV2Connection,
      allAccounts,
      error,
      requestAccounts,
      disconnectAccount,
      chainId,
      isLoading
    ]
  )

  return <accountContext.Provider value={contextValue}>{children}</accountContext.Provider>
}

export { AccountContextProvider, accountContext }
