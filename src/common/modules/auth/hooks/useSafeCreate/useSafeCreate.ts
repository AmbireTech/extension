import { useCallback, useMemo, useState } from 'react'

import { Hex } from '@ambire-common/interfaces/hex'
import { getNewSafeAccount } from '@ambire-common/libs/safe/safe'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import useSafeOwnerDetails from '@common/modules/auth/hooks/useSafeOwnerDetails'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const MIN_REQUIRED_CONFIRMATIONS = 1

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

const useSafeCreate = () => {
  const { t } = useTranslation()
  const { goToPrevRoute, goToNextRoute, safeCreateDraft, setSafeCreateDraft } =
    useOnboardingNavigation()
  const { addToast } = useToast()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { dispatchAndWait: accountPickerDispatchAndWait } = useController('AccountPickerController')
  const getOwnerDetails = useSafeOwnerDetails()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Checksummed, in the order they were added. Each one is added only once. Coming back from
  // the personalize step, they start as the user left them
  const [ownerAddresses, setOwnerAddresses] = useState<Hex[]>(
    () => safeCreateDraft?.ownerAddresses ?? []
  )
  const [selectedRequiredConfirmations, setSelectedRequiredConfirmations] = useState(
    () => safeCreateDraft?.requiredConfirmations ?? MIN_REQUIRED_CONFIRMATIONS
  )

  const owners = useMemo(
    () => ownerAddresses.map((address) => getOwnerDetails(address)),
    [ownerAddresses, getOwnerDetails]
  )

  const addOwner = useCallback((address: Hex) => {
    setOwnerAddresses((current) =>
      current.some((ownerAddress) => ownerAddress.toLowerCase() === address.toLowerCase())
        ? current
        : [...current, address]
    )
  }, [])

  const removeOwner = useCallback((address: Hex) => {
    setOwnerAddresses((current) => current.filter((ownerAddress) => ownerAddress !== address))
  }, [])

  // Kept within [1, owners count] even when owners are removed after the value was picked
  const requiredConfirmations = Math.max(
    MIN_REQUIRED_CONFIRMATIONS,
    Math.min(selectedRequiredConfirmations, ownerAddresses.length)
  )
  const canDecreaseRequiredConfirmations = requiredConfirmations > MIN_REQUIRED_CONFIRMATIONS
  const canIncreaseRequiredConfirmations = requiredConfirmations < ownerAddresses.length

  const handleDecreaseRequiredConfirmations = useCallback(() => {
    if (!canDecreaseRequiredConfirmations) return

    setSelectedRequiredConfirmations(requiredConfirmations - 1)
  }, [canDecreaseRequiredConfirmations, requiredConfirmations])

  const handleIncreaseRequiredConfirmations = useCallback(() => {
    if (!canIncreaseRequiredConfirmations) return

    setSelectedRequiredConfirmations(requiredConfirmations + 1)
  }, [canIncreaseRequiredConfirmations, requiredConfirmations])

  const isCreateButtonDisabled = !ownerAddresses.length || isSubmitting

  // Like a Safe import, the new Safe is only prepared here. The personalize step shows its
  // details, lets the user name it, and adds it to the wallet once they proceed
  const handleCreate = useCallback(async () => {
    if (isCreateButtonDisabled) return

    setIsSubmitting(true)
    try {
      // Throws on an owner setup Safe rejects, which the add owner sheet already prevents
      const newSafeAccount = getNewSafeAccount(ownerAddresses, requiredConfirmations, accounts)
      // Case-insensitive, in case an account was stored without a checksum (e.g. by an older version)
      const newSafeAddress = newSafeAccount.addr.toLowerCase()
      const isAlreadyInWallet = accounts.some(({ addr }) => addr.toLowerCase() === newSafeAddress)
      // A Safe in the wallet already isn't prepared again - the personalize step only shows it
      if (!isAlreadyInWallet) {
        await accountPickerDispatchAndWait({
          type: 'method',
          params: { method: 'prepareAccounts', args: [{ accounts: [newSafeAccount] }] }
        })
      }
      // Set before moving on, so the personalize step shows the details of this Safe
      setSafeCreateDraft({
        ownerAddresses,
        requiredConfirmations,
        safeAddress: newSafeAccount.addr as Hex,
        isAlreadyInWallet
      })
      goToNextRoute(WEB_ROUTES.accountPersonalize)
    } catch (error) {
      console.error('Failed to prepare the new Safe account', error)
      captureException(error)
      addToast(t("We couldn't create the Safe account. Please try again."), { type: 'error' })
    } finally {
      // Going back from the personalize step adds nothing, so the form is usable again
      setIsSubmitting(false)
    }
  }, [
    isCreateButtonDisabled,
    ownerAddresses,
    requiredConfirmations,
    accounts,
    addToast,
    t,
    accountPickerDispatchAndWait,
    setSafeCreateDraft,
    goToNextRoute
  ])

  return {
    title: t('Your new Safe'),
    handleBackPress: goToPrevRoute,
    owners,
    addOwner,
    removeOwner,
    requiredConfirmations,
    canDecreaseRequiredConfirmations,
    canIncreaseRequiredConfirmations,
    handleDecreaseRequiredConfirmations,
    handleIncreaseRequiredConfirmations,
    isCreateButtonDisabled,
    handleCreate
  }
}

export default useSafeCreate
