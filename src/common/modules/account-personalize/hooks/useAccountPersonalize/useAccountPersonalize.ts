import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { Account } from '@ambire-common/interfaces/account'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import { useScreenBackHandler } from '@common/contexts/screenBackContext'
import useController from '@common/hooks/useController'
import { ReplyTimeoutError } from '@common/hooks/useController/waitForReply'
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
// The already added accounts deselected on the picker, removed once the user proceeds
const selectReadyToRemoveAccounts = (state: AllControllersMappingType['AccountPickerController']) =>
  state.readyToRemoveAccounts
const selectSubType = (state: AllControllersMappingType['AccountPickerController']) => state.subType
// Set up by a flow that only sets the picker up, and not started yet
const selectIsWaitingToStart = (state: AllControllersMappingType['AccountPickerController']) =>
  !!state.initParams && !state.isInitialized && !state.readyToAddAccounts.length
const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectAddAccountsStatus = (state: AllControllersMappingType['AccountPickerController']) =>
  state.addAccountsStatus
// Takes the swipe and Android's back over, to go nowhere
const stayOnScreen = () => {}
// A stable empty list, so the callbacks depending on it keep their identity
const NO_ACCOUNTS: Account[] = []

/**
 * The personalize step of every account adding flow: shows the accounts the flow prepared
 * (or prepares them, see below), lets the user name them, and adds them once the user
 * proceeds. Nothing is added before - going back only resets the flow. Accounts a sync
 * added already are only named here. The already added accounts deselected on the picker
 * are listed too, and removed on proceeding as well.
 */
export default function useAccountPersonalize() {
  const { t } = useTranslation()
  const { goToNextRoute, syncedAccountAddrs, setSyncedAccountAddrs } = useOnboardingNavigation()
  const { state: readyToAddAccounts, dispatchAndWait: accountPickerDispatchAndWait } =
    useController('AccountPickerController', selectReadyToAddAccounts)
  const { state: readyToRemoveAccounts } = useController(
    'AccountPickerController',
    selectReadyToRemoveAccounts
  )
  const { state: subType } = useController('AccountPickerController', selectSubType)
  const { state: isWaitingToStart } = useController(
    'AccountPickerController',
    selectIsWaitingToStart
  )
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
  const accountsToRemove = isSyncedMode ? NO_ACCOUNTS : readyToRemoveAccounts

  // A sync has added its accounts already, so there is nothing to go back to - only Proceed
  // (the browser's back is handled by the onboarding navigation)
  useScreenBackHandler(isSyncedMode ? stayOnScreen : null)
  const [prepareResult, setPrepareResult] = useState<{ preparedCount: number } | 'failed' | null>(
    null
  )
  const [hasMinLoadingPassed, setHasMinLoadingPassed] = useState(false)
  const [hasMaxLoadingPassed, setHasMaxLoadingPassed] = useState(false)
  // A new run starts once another flow sets the picker up while the screen is up - on web the
  // popup only focuses this tab when it is on personalize already
  const [prepareRun, setPrepareRun] = useState(0)
  const startedPrepareRun = useRef<number | null>(null)
  const hasShownPreparedAccounts = useRef(false)
  const [isAdding, setIsAdding] = useState(false)
  // Kept once added: where the flow ends in the popup rather than here (web tabs), the
  // screen stays up and shows them as added
  const [addedAccounts, setAddedAccounts] = useState<Account[] | null>(null)
  const [removedAccounts, setRemovedAccounts] = useState<Account[]>([])

  const { control, getValues, setValue, reset } = useForm({
    defaultValues: { accounts: accountsToName }
  })
  const { fields } = useFieldArray({ control, name: 'accounts' })

  // Create, a recovery phrase and a private key only set the picker up, so it is started here,
  // once per run. The controller decides whether to start, as the state here can lag behind the flow.
  useEffect(() => {
    if (startedPrepareRun.current === prepareRun || isSyncedMode) return

    startedPrepareRun.current = prepareRun
    const isCurrentRun = () => startedPrepareRun.current === prepareRun
    accountPickerDispatchAndWait(
      { type: 'method', params: { method: 'initIfNotStarted', args: [] } },
      PREPARE_ACCOUNTS_TIMEOUT_MS
    )
      .then((preparedCount: number) => {
        if (isCurrentRun()) setPrepareResult({ preparedCount })
      })
      .catch((error) => {
        // The controller reports its own failures, here the screen only stops loading
        console.error('Failed to prepare the accounts', error)
        if (isCurrentRun()) setPrepareResult('failed')
      })
  }, [accountPickerDispatchAndWait, isSyncedMode, prepareRun])

  useEffect(() => {
    if (readyToAddAccounts.length || readyToRemoveAccounts.length)
      hasShownPreparedAccounts.current = true
  }, [readyToAddAccounts.length, readyToRemoveAccounts.length])

  // The picker was set up anew after this run's accounts were prepared, so the step starts over,
  // also from the done view a web tab keeps showing. Waiting for them to show first keeps a
  // lagging state from restarting the run it belongs to.
  useEffect(() => {
    if (!isWaitingToStart || !hasShownPreparedAccounts.current || isAdding) return

    hasShownPreparedAccounts.current = false
    setAddedAccounts(null)
    setRemovedAccounts([])
    setPrepareResult(null)
    setHasMinLoadingPassed(false)
    setHasMaxLoadingPassed(false)
    setPrepareRun((run) => run + 1)
  }, [isWaitingToStart, isAdding])

  useEffect(() => {
    const minTimeout = setTimeout(() => setHasMinLoadingPassed(true), MIN_LOADING_MS)
    const maxTimeout = setTimeout(() => setHasMaxLoadingPassed(true), MAX_LOADING_MS)

    return () => {
      clearTimeout(minTimeout)
      clearTimeout(maxTimeout)
    }
  }, [prepareRun])

  // Until the reply, then until the accounts it reports reach the state - the reply can come
  // first (mobile holds updates back while a screen transition runs)
  const preparedCount = prepareResult === 'failed' ? 0 : prepareResult?.preparedCount
  const isPreparing = !isSyncedMode && !readyToAddAccounts.length && preparedCount !== 0
  const isLoading = !hasMinLoadingPassed || (isPreparing && !hasMaxLoadingPassed)

  // Every controller update hands over a new list, so the form follows the addresses instead -
  // resetting it remounts the cards, which closes a rename the user is in the middle of
  const accountsToNameAddrs = accountsToName.map(({ addr }) => addr).join(',')
  const accountsToNameRef = useRef(accountsToName)
  useEffect(() => {
    accountsToNameRef.current = accountsToName
  }, [accountsToName])

  // The prepared accounts change when more are added from the picker. The names the
  // user gave the ones already there are kept.
  useEffect(() => {
    if (isAdding || addedAccounts) return

    const namedAccounts = getValues('accounts')
    if (namedAccounts.map(({ addr }) => addr).join(',') === accountsToNameAddrs) return

    reset({
      accounts: accountsToNameRef.current.map(
        (account) => namedAccounts.find((named) => named.addr === account.addr) || account
      )
    })
  }, [accountsToNameAddrs, isAdding, addedAccounts, getValues, reset])

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

  // The button disables on re-render, so a second press landing before it would add the
  // accounts twice - a ref, as it is set before that render
  const isProceedingRef = useRef(false)
  const { state: addAccountsStatus } = useController(
    'AccountPickerController',
    selectAddAccountsStatus
  )
  // Read once adding outlasts the wait for its reply, after the await
  const addAccountsStatusRef = useRef(addAccountsStatus)
  const accountsRef = useRef(accounts)
  const preparedRef = useRef({ readyToAddAccounts, readyToRemoveAccounts })
  // Called with how adding ended, or with `null` once the screen is gone
  const resolveAddingDoneRef = useRef<((status: typeof addAccountsStatus | null) => void) | null>(
    null
  )
  useEffect(() => {
    accountsRef.current = accounts
  }, [accounts])
  // Before the effect below, so a Proceed it resumes reads the same update
  useEffect(() => {
    preparedRef.current = { readyToAddAccounts, readyToRemoveAccounts }
  }, [readyToAddAccounts, readyToRemoveAccounts])
  // Tells a Proceed still waiting how adding ended, once the picker is no longer busy with it
  useEffect(() => {
    addAccountsStatusRef.current = addAccountsStatus
    if (addAccountsStatus === 'LOADING') return

    resolveAddingDoneRef.current?.(addAccountsStatus)
    resolveAddingDoneRef.current = null
  }, [addAccountsStatus])
  // A Proceed still waiting stops with the screen, rather than waiting for good
  useEffect(
    () => () => {
      resolveAddingDoneRef.current?.(null)
      resolveAddingDoneRef.current = null
    },
    []
  )

  const finishAdding = useCallback((namedAccounts: Account[], removedAccounts: Account[]) => {
    setRemovedAccounts(removedAccounts)
    setAddedAccounts(namedAccounts)
    goToNextRouteRef.current()
  }, [])

  const handleProceed = useCallback(async () => {
    if (isProceedingRef.current) return
    // Left set after a sync, as the screen moves on or shows them as added
    isProceedingRef.current = true

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
      finishAdding(namedAccounts, accountsToRemove)
    } catch (error) {
      if (error instanceof ReplyTimeoutError) {
        // Unexpected, but the picker can still be adding them (e.g. on a slow connection), so
        // the screen keeps showing it rather than offering to add them again
        captureException(error)
        const endStatus =
          addAccountsStatusRef.current === 'LOADING'
            ? await new Promise<typeof addAccountsStatus | null>((resolve) => {
                resolveAddingDoneRef.current = resolve
              })
            : addAccountsStatusRef.current
        if (!endStatus) return

        // Done once the picker drops what it prepared, which it does in the same update that
        // ends adding - a failure keeps them. The accounts in the wallet tell it too, but
        // their update can come later.
        const { readyToAddAccounts: toAdd, readyToRemoveAccounts: toRemove } = preparedRef.current
        const walletAddrs = new Set(accountsRef.current.map(({ addr }) => addr))
        const isAdded =
          endStatus === 'SUCCESS' ||
          (!toAdd.length && !toRemove.length) ||
          (namedAccounts.every(({ addr }) => walletAddrs.has(addr)) &&
            accountsToRemove.every(({ addr }) => !walletAddrs.has(addr)))
        if (isAdded) finishAdding(namedAccounts, accountsToRemove)
        // Otherwise it failed, which the controller reports itself
      } else {
        // The controller reports its own failures, here the button only becomes usable again
        console.error('Failed to add the accounts', error)
      }
    }
    isProceedingRef.current = false
    setIsAdding(false)
  }, [
    isSyncedMode,
    getValues,
    accountsDispatch,
    setSyncedAccountAddrs,
    accountPickerDispatchAndWait,
    accountsToRemove,
    finishAdding
  ])

  const isRemovalOnly = !fields.length && !!accountsToRemove.length
  // Removing only changes what was picked already, so there is nothing more to pick
  const canAddMore = !isSyncedMode && !addedAccounts && !isLoading && !isRemovalOnly

  const getTitle = () => {
    // A blank title while loading: the header (and its height) shows only with a title or a
    // back arrow
    if (isLoading) return ' '
    if (isRemovalOnly)
      return accountsToRemove.length > 1 ? t('Remove accounts') : t('Remove account')
    if (accountsToRemove.length) return t('Review changes')
    if (!fields.length) return t('No new accounts added')

    return fields.length > 1 ? t('Personalize accounts') : t('Personalize account')
  }

  const getProceedText = () => {
    if (isAdding) return isRemovalOnly ? t('Removing...') : t('Adding...')
    if (!isRemovalOnly) return t('Proceed')

    return accountsToRemove.length > 1
      ? t('Remove {{count}} accounts', { count: accountsToRemove.length })
      : t('Remove 1 account')
  }

  return {
    control,
    fields,
    isLoading,
    // No way back while loading, nor after a sync
    hasBackButton: !isLoading && !isSyncedMode,
    isAdding,
    addedAccounts,
    accountsToRemove,
    removedAccounts,
    isRemovalOnly,
    canProceed: (!!fields.length || !!accountsToRemove.length) && !isAdding,
    handleSaveAccountName,
    handleProceed,
    title: getTitle(),
    proceedText: getProceedText(),
    removalOnlyText: isRemovalOnly
      ? t('You deselected accounts you already have. They will be taken out of Ambire.')
      : null,
    // Removing deletes nothing that can't be brought back, which the user should know
    removalNote:
      subType === 'seed'
        ? t(
            'Removing only takes an account out of Ambire. Its funds stay where they are, and you can add it back at any time from this recovery phrase.'
          )
        : subType === 'hw'
          ? t(
              'Removing only takes an account out of Ambire. Its funds stay where they are, and you can add it back at any time from this hardware wallet.'
            )
          : t(
              'Removing only takes an account out of Ambire. Its funds stay where they are, and you can add it back at any time.'
            ),
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
