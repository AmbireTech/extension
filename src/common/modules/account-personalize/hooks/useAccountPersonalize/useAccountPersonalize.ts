import { useCallback, useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { Account } from '@ambire-common/interfaces/account'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

// Adding writes the accounts and keys, and the smart accounts' identities are created on the
// Relayer, which can take a while on a slow connection - so it gets more room than the default.
const ADD_ACCOUNTS_TIMEOUT_MS = 60_000
// Finding the next unused account derives the accounts page by page
const PREPARE_ACCOUNTS_TIMEOUT_MS = 30_000
// The loading state stays up at least this long, so it reads as a step rather than a
// flicker where preparing is quick (the extension) or already done (e.g. hardware wallets)
const MIN_LOADING_MS = 1000

const selectReadyToAddAccounts = (state: AllControllersMappingType['AccountPickerController']) =>
  state.readyToAddAccounts
const selectSubType = (state: AllControllersMappingType['AccountPickerController']) => state.subType
const selectInitParams = (state: AllControllersMappingType['AccountPickerController']) =>
  state.initParams
const selectIsInitialized = (state: AllControllersMappingType['AccountPickerController']) =>
  state.isInitialized

/**
 * The personalize step of every account adding flow: shows the accounts the flow prepared
 * (or prepares them, see below), lets the user name them, and adds them once the user
 * proceeds. Nothing is added before - going back only resets the flow.
 */
export default function useAccountPersonalize() {
  const { goToNextRoute } = useOnboardingNavigation()
  const { state: readyToAddAccounts, dispatchAndWait: accountPickerDispatchAndWait } =
    useController('AccountPickerController', selectReadyToAddAccounts)
  const { state: subType } = useController('AccountPickerController', selectSubType)
  const { state: initParams } = useController('AccountPickerController', selectInitParams)
  const { state: isInitialized } = useController('AccountPickerController', selectIsInitialized)
  const [prepareResult, setPrepareResult] = useState<'done' | 'failed' | null>(null)
  const [hasMinLoadingPassed, setHasMinLoadingPassed] = useState(false)
  const hasStartedPreparing = useRef(false)
  const [isAdding, setIsAdding] = useState(false)
  // Kept once added: where the flow ends in the popup rather than here (web tabs), the
  // screen stays up and shows them as added
  const [addedAccounts, setAddedAccounts] = useState<Account[] | null>(null)

  const { control, getValues, reset } = useForm({
    defaultValues: { accounts: readyToAddAccounts }
  })
  const { fields } = useFieldArray({ control, name: 'accounts' })

  // The flows that come straight here (Create, a recovery phrase, a private key) only set the
  // picker up, so the screen opens at once and the account is selected and prepared here,
  // while it shows that it is loading. `initParams` is a gate, not a trigger: a new object
  // arrives with every state update, so the ref keeps it from running twice.
  useEffect(() => {
    if (hasStartedPreparing.current) return
    if (!initParams || isInitialized || readyToAddAccounts.length) return

    hasStartedPreparing.current = true
    accountPickerDispatchAndWait(
      { type: 'method', params: { method: 'init', args: [] } },
      PREPARE_ACCOUNTS_TIMEOUT_MS
    )
      .then(() => setPrepareResult('done'))
      .catch((error) => {
        // The controller reports its own failures, here the screen only stops loading
        console.error('Failed to prepare the accounts', error)
        setPrepareResult('failed')
      })
  }, [initParams, isInitialized, readyToAddAccounts.length, accountPickerDispatchAndWait])

  useEffect(() => {
    const timeout = setTimeout(() => setHasMinLoadingPassed(true), MIN_LOADING_MS)

    return () => clearTimeout(timeout)
  }, [])

  const isPreparing = !!initParams && !readyToAddAccounts.length && !prepareResult
  const isLoading = !hasMinLoadingPassed || isPreparing

  // The prepared accounts change when more are added from the picker. The names the
  // user gave the ones already there are kept.
  useEffect(() => {
    if (isAdding || addedAccounts) return

    const namedAccounts = getValues('accounts')
    reset({
      accounts: readyToAddAccounts.map(
        (account) => namedAccounts.find((named) => named.addr === account.addr) || account
      )
    })
  }, [readyToAddAccounts, isAdding, addedAccounts, getValues, reset])

  // Where the flow goes on depends on the accounts just added, so the latest one is read
  const goToNextRouteRef = useRef(goToNextRoute)
  useEffect(() => {
    goToNextRouteRef.current = goToNextRoute
  }, [goToNextRoute])

  const handleProceed = useCallback(async () => {
    if (isAdding) return

    const accounts = getValues('accounts')
    setIsAdding(true)
    try {
      await accountPickerDispatchAndWait(
        {
          type: 'method',
          params: {
            method: 'addPreparedAccounts',
            args: [accounts.map(({ addr, preferences }) => ({ addr, preferences }))]
          }
        },
        ADD_ACCOUNTS_TIMEOUT_MS
      )
      setAddedAccounts(accounts)
      goToNextRouteRef.current()
    } catch (error) {
      // The controller reports its own failures, here the button only becomes usable again
      console.error('Failed to add the accounts', error)
    } finally {
      setIsAdding(false)
    }
  }, [isAdding, getValues, accountPickerDispatchAndWait])

  return {
    control,
    fields,
    isLoading,
    hasPreparingFailed: prepareResult === 'failed',
    isAdding,
    addedAccounts,
    handleProceed,
    // Only a recovery phrase or a hardware wallet has more accounts to pick from
    addMoreSource:
      !addedAccounts && !isLoading && (subType === 'seed' || subType === 'hw') ? subType : null
  }
}
