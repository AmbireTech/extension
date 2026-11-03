import { useCallback, useMemo, useState } from 'react'

import { Hex } from '@ambire-common/interfaces/hex'
import { getNewSafeAccount } from '@ambire-common/libs/safe/safe'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import { useScreenBackHandler } from '@common/contexts/screenBackContext'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import useSafeOwnerDetails, { SafeOwnerDetails } from '@common/modules/auth/hooks/useSafeOwnerDetails'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** What the preview step shows about the Safe about to be created */
export type SafeCreatePreview = {
  address: Hex
  version: string
  requiredConfirmations: number
  owners: SafeOwnerDetails[]
}

/** The Safe version `getNewSafeAccount` creates (see `SAFE_V1_4_1`) */
const NEW_SAFE_VERSION = '1.4.1'

const MIN_REQUIRED_CONFIRMATIONS = 1

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

const useSafeCreate = () => {
  const { t } = useTranslation()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { addToast } = useToast()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { dispatchAndWait: accountPickerDispatchAndWait } = useController('AccountPickerController')
  const getOwnerDetails = useSafeOwnerDetails()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // The preview is a step of this screen, so going back to the form keeps what was entered
  const [isPreviewing, setIsPreviewing] = useState(false)
  // Checksummed, in the order they were added. Each one is added only once
  const [ownerAddresses, setOwnerAddresses] = useState<Hex[]>([])
  const [selectedRequiredConfirmations, setSelectedRequiredConfirmations] = useState(
    MIN_REQUIRED_CONFIRMATIONS
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

  const isContinueButtonDisabled = !ownerAddresses.length

  // Built only for the preview, as the address can't change while it's shown
  const newSafeAccount = useMemo(
    () =>
      isPreviewing && ownerAddresses.length
        ? getNewSafeAccount(ownerAddresses, requiredConfirmations, accounts)
        : null,
    [isPreviewing, ownerAddresses, requiredConfirmations, accounts]
  )

  const preview = useMemo<SafeCreatePreview | null>(() => {
    if (!newSafeAccount) return null

    return {
      address: newSafeAccount.addr as Hex,
      version: NEW_SAFE_VERSION,
      requiredConfirmations,
      owners
    }
  }, [newSafeAccount, requiredConfirmations, owners])

  const handleContinue = useCallback(() => {
    if (isContinueButtonDisabled) return

    // Checked before the preview, so the user fixes the setup while still on the form
    const { addr: newSafeAddress } = getNewSafeAccount(
      ownerAddresses,
      requiredConfirmations,
      accounts
    )
    if (accounts.some(({ addr }) => addr === newSafeAddress)) {
      addToast(
        t(
          'This Safe account is already in your wallet. The same owners and required confirmations always lead to the same account.'
        ),
        { type: 'error' }
      )
      return
    }

    setIsPreviewing(true)
  }, [isContinueButtonDisabled, ownerAddresses, requiredConfirmations, accounts, addToast, t])

  const handleBackToForm = useCallback(() => setIsPreviewing(false), [])

  // The swipe and Android's back return to the form from the preview, like the back arrow
  useScreenBackHandler(isPreviewing ? handleBackToForm : null)

  const handleBackPress = isPreviewing ? handleBackToForm : goToPrevRoute
  const title = isPreviewing ? t('Review Safe account') : t('Create Safe account')

  const isCreateButtonDisabled = !newSafeAccount || isSubmitting

  // Like a Safe import, the new Safe is only prepared here. The personalize step, where the
  // user can name it, adds it to the wallet once they proceed
  const handleCreate = useCallback(async () => {
    if (isCreateButtonDisabled || !newSafeAccount) return

    setIsSubmitting(true)
    try {
      await accountPickerDispatchAndWait({
        type: 'method',
        params: { method: 'prepareAccounts', args: [{ accounts: [newSafeAccount] }] }
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
    newSafeAccount,
    addToast,
    t,
    accountPickerDispatchAndWait,
    goToNextRoute
  ])

  return {
    title,
    handleBackPress,
    owners,
    addOwner,
    removeOwner,
    requiredConfirmations,
    canDecreaseRequiredConfirmations,
    canIncreaseRequiredConfirmations,
    handleDecreaseRequiredConfirmations,
    handleIncreaseRequiredConfirmations,
    isContinueButtonDisabled,
    handleContinue,
    preview,
    isCreateButtonDisabled,
    handleCreate
  }
}

export default useSafeCreate
