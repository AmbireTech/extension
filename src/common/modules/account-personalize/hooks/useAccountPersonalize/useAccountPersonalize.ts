import { useCallback, useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { Account } from '@ambire-common/interfaces/account'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

// Adding writes the accounts and keys, and the smart accounts' identities are created on the
// Relayer, which can take a while on a slow connection - so it gets more room than the default.
const ADD_ACCOUNTS_TIMEOUT_MS = 60_000

const selectReadyToAddAccounts = (state: AllControllersMappingType['AccountPickerController']) =>
  state.readyToAddAccounts
const selectSubType = (state: AllControllersMappingType['AccountPickerController']) => state.subType

/**
 * The personalize step of every account adding flow: shows the accounts the flow prepared,
 * lets the user name them, and adds them once the user proceeds. Nothing is added before -
 * going back only resets the flow.
 */
export default function useAccountPersonalize() {
  const { goToNextRoute } = useOnboardingNavigation()
  const { state: readyToAddAccounts, dispatchAndWait: accountPickerDispatchAndWait } =
    useController('AccountPickerController', selectReadyToAddAccounts)
  const { state: subType } = useController('AccountPickerController', selectSubType)
  const [isAdding, setIsAdding] = useState(false)
  // Kept once added: where the flow ends in the popup rather than here (web tabs), the
  // screen stays up and shows them as added
  const [addedAccounts, setAddedAccounts] = useState<Account[] | null>(null)

  const { control, getValues, reset } = useForm({
    defaultValues: { accounts: readyToAddAccounts }
  })
  const { fields } = useFieldArray({ control, name: 'accounts' })

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
    isAdding,
    addedAccounts,
    handleProceed,
    // Only a recovery phrase or a hardware wallet has more accounts to pick from
    addMoreSource: !addedAccounts && (subType === 'seed' || subType === 'hw') ? subType : null
  }
}
