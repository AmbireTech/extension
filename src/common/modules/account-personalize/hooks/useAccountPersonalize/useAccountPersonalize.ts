import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { Account } from '@ambire-common/interfaces/account'
import { useTranslation } from '@common/config/localization'
import { useScreenBackHandler } from '@common/contexts/screenBackContext'
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
// ...and at most this long while waiting for accounts, after which the screen shows that
// there are none (and fills in, should they still arrive)
const MAX_LOADING_MS = 5000

const selectReadyToAddAccounts = (state: AllControllersMappingType['AccountPickerController']) =>
  state.readyToAddAccounts
const selectSubType = (state: AllControllersMappingType['AccountPickerController']) => state.subType
const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
// Takes the swipe and Android's back over, to go nowhere
const stayOnScreen = () => {}

/**
 * The personalize step of every account adding flow: shows the accounts the flow prepared
 * (or prepares them, see below), lets the user name them, and adds them once the user
 * proceeds. Nothing is added before - going back only resets the flow. Accounts a sync
 * added already are only named here.
 */
export default function useAccountPersonalize() {
  const { t } = useTranslation()
  const { goToNextRoute, syncedAccountAddrs, setSyncedAccountAddrs } = useOnboardingNavigation()
  const { state: readyToAddAccounts, dispatchAndWait: accountPickerDispatchAndWait } =
    useController('AccountPickerController', selectReadyToAddAccounts)
  const { state: subType } = useController('AccountPickerController', selectSubType)
  const { state: accounts, dispatch: accountsDispatch } = useController(
    'AccountsController',
    selectAccounts
  )
  const isSyncedMode = !!syncedAccountAddrs.length
  const syncedAccounts = useMemo(() => {
    const syncedAddrs = syncedAccountAddrs.map((addr) => addr.toLowerCase())

    return accounts.filter(({ addr }) => syncedAddrs.includes(addr.toLowerCase()))
  }, [accounts, syncedAccountAddrs])
  const accountsToName = isSyncedMode ? syncedAccounts : readyToAddAccounts

  // A sync has added its accounts already, so there is nothing to go back to - only Proceed
  // (the browser's back is handled by the onboarding navigation)
  useScreenBackHandler(isSyncedMode ? stayOnScreen : null)
  const [prepareResult, setPrepareResult] = useState<{ preparedCount: number } | 'failed' | null>(
    null
  )
  const [hasMinLoadingPassed, setHasMinLoadingPassed] = useState(false)
  const [hasMaxLoadingPassed, setHasMaxLoadingPassed] = useState(false)
  const hasStartedPreparing = useRef(false)
  const [isAdding, setIsAdding] = useState(false)
  // Kept once added: where the flow ends in the popup rather than here (web tabs), the
  // screen stays up and shows them as added
  const [addedAccounts, setAddedAccounts] = useState<Account[] | null>(null)

  const { control, getValues, setValue, reset } = useForm({
    defaultValues: { accounts: accountsToName }
  })
  const { fields } = useFieldArray({ control, name: 'accounts' })

  // Create, a recovery phrase and a private key only set the picker up, so it is started here,
  // once. The controller decides whether to start, as the state here can lag behind the flow.
  useEffect(() => {
    if (hasStartedPreparing.current || isSyncedMode) return

    hasStartedPreparing.current = true
    accountPickerDispatchAndWait(
      { type: 'method', params: { method: 'initIfNotStarted', args: [] } },
      PREPARE_ACCOUNTS_TIMEOUT_MS
    )
      .then((preparedCount: number) => setPrepareResult({ preparedCount }))
      .catch((error) => {
        // The controller reports its own failures, here the screen only stops loading
        console.error('Failed to prepare the accounts', error)
        setPrepareResult('failed')
      })
  }, [accountPickerDispatchAndWait, isSyncedMode])

  useEffect(() => {
    const minTimeout = setTimeout(() => setHasMinLoadingPassed(true), MIN_LOADING_MS)
    const maxTimeout = setTimeout(() => setHasMaxLoadingPassed(true), MAX_LOADING_MS)

    return () => {
      clearTimeout(minTimeout)
      clearTimeout(maxTimeout)
    }
  }, [])

  // Until the reply, then until the accounts it reports reach the state - the reply can come
  // first (mobile holds updates back while a screen transition runs)
  const preparedCount = prepareResult === 'failed' ? 0 : prepareResult?.preparedCount
  const isPreparing = !isSyncedMode && !readyToAddAccounts.length && preparedCount !== 0
  const isLoading = !hasMinLoadingPassed || (isPreparing && !hasMaxLoadingPassed)

  // The prepared accounts change when more are added from the picker. The names the
  // user gave the ones already there are kept.
  useEffect(() => {
    if (isAdding || addedAccounts) return

    const namedAccounts = getValues('accounts')
    reset({
      accounts: accountsToName.map(
        (account) => namedAccounts.find((named) => named.addr === account.addr) || account
      )
    })
  }, [accountsToName, isAdding, addedAccounts, getValues, reset])

  // Only renames the account in the form - the names are saved with the accounts on Proceed
  const handleSaveAccountName = useCallback(
    async (addr: Account['addr'], label: string) => {
      const index = getValues('accounts').findIndex((account) => account.addr === addr)
      if (index === -1) throw new Error('The account to rename is missing from the form')

      setValue(`accounts.${index}.preferences.label`, label)
    },
    [getValues, setValue]
  )

  // Where the flow goes on depends on the accounts just added, so the latest one is read
  const goToNextRouteRef = useRef(goToNextRoute)
  useEffect(() => {
    goToNextRouteRef.current = goToNextRoute
  }, [goToNextRoute])

  const handleProceed = useCallback(async () => {
    if (isAdding) return

    const namedAccounts = getValues('accounts')
    const names = namedAccounts.map(({ addr, preferences }) => ({ addr, preferences }))
    if (isSyncedMode) {
      accountsDispatch({
        type: 'method',
        params: { method: 'updateAccountPreferences', args: [names] }
      })
      setAddedAccounts(namedAccounts)
      // Dropped first, as the way back is closed only while they are set
      setSyncedAccountAddrs([])
      goToNextRouteRef.current()
      return
    }

    setIsAdding(true)
    try {
      await accountPickerDispatchAndWait(
        { type: 'method', params: { method: 'addPreparedAccounts', args: [names] } },
        ADD_ACCOUNTS_TIMEOUT_MS
      )
      setAddedAccounts(namedAccounts)
      goToNextRouteRef.current()
    } catch (error) {
      // The controller reports its own failures, here the button only becomes usable again
      console.error('Failed to add the accounts', error)
    } finally {
      setIsAdding(false)
    }
  }, [
    isAdding,
    isSyncedMode,
    getValues,
    accountsDispatch,
    setSyncedAccountAddrs,
    accountPickerDispatchAndWait
  ])

  const canAddMore = !isSyncedMode && !addedAccounts && !isLoading

  return {
    control,
    fields,
    isLoading,
    // No way back while loading, nor after a sync
    hasBackButton: !isLoading && !isSyncedMode,
    isAdding,
    addedAccounts,
    handleSaveAccountName,
    handleProceed,
    // A blank title while loading: the header (and its height) shows only with a title or a
    // back arrow
    title: isLoading
      ? ' '
      : !fields.length
        ? t('No new accounts added')
        : fields.length > 1
          ? t('Personalize accounts')
          : t('Personalize account'),
    // Preparing failed, every account was deselected on the picker, or the prepared accounts
    // are gone (the app or browser was restarted) - nothing to add, only to go back from
    noAccountsText:
      prepareResult === 'failed'
        ? t("We couldn't load your accounts. Please go back and try again.")
        : t('There are no accounts to add. Go back to select the accounts you want to add.'),
    // Only a recovery phrase or a hardware wallet has more accounts to pick from
    addMoreText:
      canAddMore && subType === 'seed'
        ? t('Add more accounts from this recovery phrase')
        : canAddMore && subType === 'hw'
          ? t('Add more accounts from this hardware wallet')
          : null
  }
}
