/* eslint-disable prettier/prettier */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { Account } from '@ambire-common/interfaces/account'
import wait from '@ambire-common/utils/wait'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { openInTab } from '@common/utils/links'

export default function useAccountPersonalize() {
  const { goToNextRoute, setAccountsToPersonalize, accountsToPersonalize } =
    useOnboardingNavigation()

  const { state: accountPickerState, dispatch: accountPickerDispatch } =
    useController('AccountPickerController')
  const {
    state: { statuses, accounts },
    dispatch: accountsDispatch
  } = useController('AccountsController')
  const { isSetupComplete } = useController('WalletStateController').state
  const { addToast } = useToast()
  const initPassed = useRef(false)
  const newlyAddedAccounts = useMemo(() => accounts.filter((a) => a.newlyAdded) || [], [accounts])

  const { handleSubmit, control, setValue, getValues } = useForm({
    defaultValues: {
      accounts: accountPickerState.addedAccountsFromCurrentSession || newlyAddedAccounts
    }
  })

  // Remains in loading state until `accountsToPersonalize` are loaded
  const [isLoading, setIsLoading] = useState(true)
  // Enters into completed state after the `Complete` button is pressed
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!accountPickerState.initParams) return
    if (accountPickerState.isInitialized) return
    if (initPassed.current && !completed) return

    accountPickerDispatch({
      type: 'method',
      params: {
        method: 'init',
        args: []
      }
    })
    if (!isLoading) setIsLoading(true)
    if (completed) setCompleted(false)
    if (accountsToPersonalize.length) setAccountsToPersonalize([])
    initPassed.current = true
  }, [
    isLoading,
    accountPickerDispatch,
    accountPickerState.isInitialized,
    accountPickerState.initParams,
    completed,
    accountsToPersonalize,
    setAccountsToPersonalize
  ])

  useEffect(() => {
    if (
      !accountPickerState.initParams &&
      !accountPickerState.isInitialized &&
      accountsToPersonalize.length &&
      !newlyAddedAccounts.length &&
      !completed
    ) {
      setCompleted(true)
      initPassed.current = false
    }
  }, [
    accountPickerState.initParams,
    accountPickerState.isInitialized,
    accountsToPersonalize.length,
    completed,
    newlyAddedAccounts.length,
    goToNextRoute,
    isSetupComplete
  ])

  useEffect(() => {
    if (!isSetupComplete && !!completed) goToNextRoute()
  }, [completed, goToNextRoute, isSetupComplete])

  const accountPickerInitializedRef = useRef(accountPickerState.isInitialized)
  const accountsToPersonalizeRef = useRef(accountsToPersonalize)
  const newlyAddedAccountsRef = useRef(newlyAddedAccounts)
  const isLoadingRef = useRef(isLoading)

  useEffect(() => {
    accountPickerInitializedRef.current = accountPickerState.isInitialized
  }, [accountPickerState.isInitialized])

  useEffect(() => {
    accountsToPersonalizeRef.current = accountsToPersonalize
  }, [accountsToPersonalize])

  useEffect(() => {
    newlyAddedAccountsRef.current = newlyAddedAccounts
  }, [newlyAddedAccounts])

  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  const accountPickerShouldAddAutomaticallyRef = useRef(
    accountPickerState.initParams?.shouldAddNextAccountAutomatically
  )
  useEffect(() => {
    accountPickerShouldAddAutomaticallyRef.current =
      accountPickerState.initParams?.shouldAddNextAccountAutomatically
  }, [accountPickerState.initParams?.shouldAddNextAccountAutomatically])

  useEffect(() => {
    // We reference the latest values via refs. Accessing state directly inside this
    // async effect could read outdated values, since state updates are not guaranteed
    // to sync during the async wait loops.
    const getShouldStopLoadingBasedOnLatestState = () => {
      const hasAccounts =
        (accountsToPersonalizeRef.current && accountsToPersonalizeRef.current.length > 0) ||
        (newlyAddedAccountsRef.current && newlyAddedAccountsRef.current.length > 0)

      const isInitialized = !!accountPickerInitializedRef.current
      const shouldAddAutomatically = accountPickerShouldAddAutomaticallyRef.current ?? true

      if (isInitialized) {
        // If we expect the controller to automatically add an account,
        // we shouldn't stop loading until the account is actually in state.
        if (shouldAddAutomatically) {
          return hasAccounts
        }
        return true
      }

      return hasAccounts
    }

    // We reference the latest values via refs. Accessing state directly inside this
    // async effect could read outdated values, since state updates are not guaranteed
    // to sync during the async wait loops.
    const getShouldComplete = () => {
      const isInitialized = !!accountPickerInitializedRef.current
      const hasAccounts =
        (accountsToPersonalizeRef.current && accountsToPersonalizeRef.current.length > 0) ||
        (newlyAddedAccountsRef.current && newlyAddedAccountsRef.current.length > 0)
      const shouldAddAutomatically = accountPickerShouldAddAutomaticallyRef.current ?? true

      if (!isInitialized && shouldAddAutomatically) {
        return false // don't complete yet, we're waiting for auto-add
      }

      return !isInitialized && !hasAccounts
    }

    let resolved = false

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      // initial UX delay
      await wait(1100)
      if (resolved) return

      if (getShouldStopLoadingBasedOnLatestState()) {
        if (!resolved) setIsLoading(false)
        return
      }

      const timeoutMs = 3000 // Poll for up to 3s to allow controller updates to arrive.
      const intervalMs = 200 // Poll interval
      const start = Date.now()

      while (Date.now() - start < timeoutMs && !resolved) {
        // eslint-disable-next-line no-await-in-loop
        await wait(intervalMs)
        if (resolved) return
        if (getShouldStopLoadingBasedOnLatestState()) {
          if (!resolved) setIsLoading(false)
          return
        }
      }

      if (resolved) return
      if (!isLoadingRef.current) return

      setIsLoading(false)
      if (getShouldComplete()) setCompleted(true)
    })()

    return () => {
      resolved = true
    }
  }, [isLoading])

  // the hook inits the list with accountsToPersonalize
  useEffect(() => {
    if (accountsToPersonalize.length) return

    let state: Account[] = []
    if (accountPickerState.isInitialized) {
      state = accountPickerState.addedAccountsFromCurrentSession
    }

    if (!accountPickerState.isInitialized && newlyAddedAccounts.length) {
      state = newlyAddedAccounts
    }

    if (state.length) {
      setAccountsToPersonalize(state)
    } else {
      if (isLoading) return

      const shouldAddAutomatically =
        accountPickerState.initParams?.shouldAddNextAccountAutomatically ?? true

      // If we expect the controller to automatically add an account, we
      // shouldn't redirect simply because the account isn't in state yet.
      // A yield to the UI might happen between selectNextAccount and addAccounts.
      if (accountPickerState.isInitialized && shouldAddAutomatically) return

      goToNextRoute()
    }
  }, [
    isLoading,
    accountPickerState.isInitialized,
    accountPickerState.initParams?.shouldAddNextAccountAutomatically,
    accountPickerState.addedAccountsFromCurrentSession,
    accountsToPersonalize.length,
    newlyAddedAccounts,
    statuses.addAccounts,
    setAccountsToPersonalize,
    goToNextRoute
  ])

  // prevents showing accounts to personalize from prev sessions
  useEffect(() => {
    if (newlyAddedAccounts.length && accountPickerState.isInitialized) {
      accountsDispatch({
        type: 'method',
        params: {
          method: 'resetAccountsNewlyAddedState',
          args: []
        }
      })
    }
  }, [newlyAddedAccounts.length, accountPickerState.isInitialized, accountsDispatch])

  useEffect(() => {
    setValue('accounts', accountsToPersonalize)
  }, [accountsToPersonalize, setValue])

  const { fields } = useFieldArray({ control, name: 'accounts' })

  const handleSave = useCallback(
    (data?: { accounts: Account[] }) => {
      const newAccounts = data?.accounts || getValues('accounts')
      accountsDispatch({
        type: 'method',
        params: {
          method: 'updateAccountPreferences',
          args: [newAccounts.map((a) => ({ addr: a.addr, preferences: a.preferences }))]
        }
      })
    },
    [accountsDispatch, getValues]
  )

  useEffect(() => {
    const handleBeforeUnload = () => handleSave()
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [handleSave])

  const handleComplete = useCallback(async () => {
    await handleSubmit(handleSave)()
    accountsDispatch({
      type: 'method',
      params: {
        method: 'resetAccountsNewlyAddedState',
        args: []
      }
    })
    if (isSetupComplete) {
      initPassed.current = false
      accountPickerDispatch({
        type: 'method',
        params: {
          method: 'reset',
          args: []
        }
      })
    } else {
      setCompleted(true)
    }
  }, [isSetupComplete, accountsDispatch, accountPickerDispatch, handleSave, handleSubmit])

  const handleContactSupport = useCallback(async () => {
    try {
      await openInTab({ url: 'https://help.ambire.com/hc/en-us/requests/new' })
    } catch {
      addToast("Couldn't open link", { type: 'error' })
    }
  }, [addToast])

  return {
    isLoading,
    completed,
    fields,
    control,
    accounts,
    accountPickerState,
    accountsToPersonalize,
    handleSave,
    handleComplete,
    handleContactSupport
  }
}
