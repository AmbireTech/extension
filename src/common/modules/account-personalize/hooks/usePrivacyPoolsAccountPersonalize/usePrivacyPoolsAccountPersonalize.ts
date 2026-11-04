import { useCallback, useEffect, useRef, useState } from 'react'

import { PrivacyPoolsAccountToAdd } from '@ambire-common/interfaces/privacyPools'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { ReplyTimeoutError } from '@common/hooks/useController/waitForReply'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectPrivacyPoolsAccountToAdd = (
  state: AllControllersMappingType['AccountPickerController']
) => state.privacyPoolsAccountToAdd
// Any flow under way, this one included
const selectHasAccountAddingFlow = (state: AllControllersMappingType['AccountPickerController']) =>
  !!state.initParams || !!state.privacyPoolsInitParams || !!state.readyToAddAccounts.length
const selectSeeds = (state: AllControllersMappingType['KeystoreController']) => state.seeds

// Tells a renamed account from the next one prepared, as every update hands over a new object
const getAccountKey = (account: PrivacyPoolsAccountToAdd) =>
  account.isNewSeed ? 'new-seed' : account.seedId

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
  const { dispatchAndWait: mainDispatchAndWait } = useController('MainController')
  const [rename, setRename] = useState<{ accountKey: string; name: string } | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  // Kept once added, as the picker drops the prepared account: the screen keeps showing it while
  // it leaves, and a web tab shows it as added
  const [addedAccount, setAddedAccount] = useState<PrivacyPoolsAccountToAdd | null>(null)
  // The button disables on re-render, so a second press landing before it would add it twice
  const isProceedingRef = useRef(false)

  // A flow started after this one, so the account added before is no longer what the screen shows
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hasAccountAddingFlow) setAddedAccount(null)
  }, [hasAccountAddingFlow])

  const account = accountToAdd ?? addedAccount
  const name =
    account && rename?.accountKey === getAccountKey(account) ? rename.name : account?.label || ''
  const seedLabel =
    account && !account.isNewSeed
      ? (seeds || []).find(({ id }) => id === account.seedId)?.label
      : undefined

  // Only renames it on the screen - the name is saved with the account on Proceed
  const handleSaveName = useCallback(
    async (newName: string) => {
      if (!accountToAdd) throw new Error('The account to rename is no longer prepared')

      setRename({ accountKey: getAccountKey(accountToAdd), name: newName })
    },
    [accountToAdd]
  )

  const handleProceed = useCallback(async () => {
    if (isProceedingRef.current || !accountToAdd) return
    isProceedingRef.current = true
    setIsAdding(true)

    try {
      await mainDispatchAndWait({
        type: 'method',
        params: { method: 'addPreparedPrivacyPoolsAccount', args: [name] }
      })
      setAddedAccount({ ...accountToAdd, label: name })
      setRename(null)
      // The wallet has accounts already, as a Privacy Pools account is added from it
      goToNextRoute('/')
    } catch (error) {
      // Unexpected - the controller replies once it is done. Otherwise it reports its own failures
      if (error instanceof ReplyTimeoutError) captureException(error)
      console.error('Failed to add the Privacy Pools account', error)
    }
    isProceedingRef.current = false
    setIsAdding(false)
  }, [accountToAdd, goToNextRoute, mainDispatchAndWait, name])

  return {
    account: account
      ? {
          name,
          // It has no address, so its recovery phrase tells it apart
          sourceText: seedLabel
            ? t('Added from {{seedLabel}}', { seedLabel })
            : t('Added from a new recovery phrase')
        }
      : null,
    isAdding,
    addedAccount,
    handleSaveName,
    handleProceed
  }
}
