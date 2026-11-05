import { useCallback, useEffect, useRef, useState } from 'react'

import { PrivacyPoolsAccountToAdd } from '@ambire-common/interfaces/privacyPools'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { getPrivacyPoolsSourceLabel } from '@common/hooks/usePrivacyPoolsAccounts'
import { ReplyTimeoutError } from '@common/hooks/useController/waitForReply'
import { ADD_ACCOUNTS_TIMEOUT_MS } from '@common/modules/account-personalize/constants/timeouts'
import { selectHasAccountAddingFlow } from '@common/modules/auth/contexts/onboardingNavigationContext'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectPrivacyPoolsAccountToAdd = (
  state: AllControllersMappingType['AccountPickerController']
) => state.privacyPoolsAccountToAdd
const selectSeeds = (state: AllControllersMappingType['KeystoreController']) => state.seeds
const selectSelectAccountStatus = (state: AllControllersMappingType['MainController']) =>
  state.statuses.selectAccount

/**
 * The personalize step of a Privacy Pools account: shows the account the flow prepared, lets the
 * user name it, and adds it once the user proceeds. Nothing is added before - going back only
 * resets the flow. `account` is null while no such account is prepared.
 */
export default function usePrivacyPoolsAccountPersonalize() {
  const { t } = useTranslation()
  const { goToNextRoute } = useOnboardingNavigation()
  const { state: accountToAdd } = useController(
    'AccountPickerController',
    selectPrivacyPoolsAccountToAdd
  )
  const { state: hasAccountAddingFlow } = useController(
    'AccountPickerController',
    selectHasAccountAddingFlow
  )
  const { state: seeds } = useController('KeystoreController', selectSeeds)
  const { state: selectAccountStatus } = useController('MainController', selectSelectAccountStatus)
  const { dispatchAndWait: mainDispatchAndWait } = useController('MainController')
  const [rename, setRename] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  // Kept while adding, as the picker drops the prepared account before main replies
  const [addingAccount, setAddingAccount] = useState<PrivacyPoolsAccountToAdd | null>(null)
  // Kept once added: the screen keeps showing it while it leaves, and a web tab shows it as added
  const [addedAccount, setAddedAccount] = useState<PrivacyPoolsAccountToAdd | null>(null)
  // The button disables on re-render, so a second press landing before it would add it twice
  const isProceedingRef = useRef(false)
  // Read once adding outlasts the wait for its reply, after the await
  const accountToAddRef = useRef(accountToAdd)
  const selectAccountStatusRef = useRef(selectAccountStatus)
  // Called with `true` once main is no longer busy adding, or with `false` once the screen is gone
  const resolveAddingDoneRef = useRef<((hasEnded: boolean) => void) | null>(null)

  // A flow started after this one, so the account added before is no longer what the screen shows
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hasAccountAddingFlow) setAddedAccount(null)
  }, [hasAccountAddingFlow])
  // Before the effect below, so a Proceed it resumes reads the same update
  useEffect(() => {
    accountToAddRef.current = accountToAdd
    // The flow ended (added, or the user went back), so a name typed for it is not the next one's
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!accountToAdd) setRename(null)
  }, [accountToAdd])
  // Tells a Proceed still waiting that adding ended, once main is no longer busy with it
  useEffect(() => {
    selectAccountStatusRef.current = selectAccountStatus
    if (selectAccountStatus === 'LOADING') return

    resolveAddingDoneRef.current?.(true)
    resolveAddingDoneRef.current = null
  }, [selectAccountStatus])
  // A Proceed still waiting stops with the screen, rather than waiting for good
  useEffect(
    () => () => {
      resolveAddingDoneRef.current?.(false)
      resolveAddingDoneRef.current = null
    },
    []
  )

  const account = accountToAdd ?? addingAccount ?? addedAccount
  const name = rename ?? account?.label ?? ''
  const seed =
    account && !account.isNewSeed
      ? (seeds || []).find(({ id }) => id === account.seedId)
      : undefined
  const sourceLabel = seed
    ? getPrivacyPoolsSourceLabel(seed.label, seed.passphraseLabel, t)
    : undefined
  // Main drops an add while it is still switching accounts, so the button waits for it
  const canProceed =
    !isAdding && (selectAccountStatus === 'INITIAL' || selectAccountStatus === 'SUCCESS')

  // Only renames it on the screen - the name is saved with the account on Proceed
  const handleSaveName = useCallback(
    async (newName: string) => {
      if (!accountToAdd) throw new Error('The account to rename is no longer prepared')

      setRename(newName)
    },
    [accountToAdd]
  )

  const handleProceed = useCallback(async () => {
    if (isProceedingRef.current || !accountToAdd) return
    isProceedingRef.current = true
    const proceededAccount = { ...accountToAdd, label: name }
    setAddingAccount(proceededAccount)
    setIsAdding(true)
    const finishAdding = () => {
      setAddedAccount(proceededAccount)
      // The wallet has accounts already, as a Privacy Pools account is added from it
      goToNextRoute('/')
    }

    try {
      await mainDispatchAndWait(
        { type: 'method', params: { method: 'addPreparedPrivacyPoolsAccount', args: [name] } },
        ADD_ACCOUNTS_TIMEOUT_MS
      )
      finishAdding()
    } catch (error) {
      if (error instanceof ReplyTimeoutError) {
        // Unexpected, but main can still be adding it, so the screen keeps showing it rather
        // than offering to add it again
        captureException(error)
        const hasEnded =
          selectAccountStatusRef.current === 'LOADING'
            ? await new Promise<boolean>((resolve) => {
                resolveAddingDoneRef.current = resolve
              })
            : true
        if (!hasEnded) return

        // Added once the picker drops the prepared account, which a failure keeps
        if (!accountToAddRef.current) finishAdding()
      } else {
        // The controller reports its own failures, here the button only becomes usable again
        console.error('Failed to add the Privacy Pools account', error)
      }
    }
    isProceedingRef.current = false
    setAddingAccount(null)
    setIsAdding(false)
  }, [accountToAdd, goToNextRoute, mainDispatchAndWait, name])

  return {
    account: account
      ? {
          name,
          // It has no address, so its recovery phrase tells it apart
          sourceText: sourceLabel
            ? t('From {{seedLabel}}', { seedLabel: sourceLabel })
            : t('From a new recovery phrase')
        }
      : null,
    isAdding,
    canProceed,
    addedAccount,
    handleSaveName,
    handleProceed
  }
}
