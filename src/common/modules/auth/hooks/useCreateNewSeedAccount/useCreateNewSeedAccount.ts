import { useCallback, useEffect, useRef, useState } from 'react'

import useController from '@common/hooks/useController'
import useExtraEntropy from '@common/hooks/useExtraEntropy'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

/**
 * Creates a brand new recovery phrase in the background and takes the user straight to
 * the account personalize step. The phrase is not revealed at this point - the user is
 * asked to write it down later, once the account holds funds.
 */
export default function useCreateNewSeedAccount() {
  const { goToNextRoute } = useOnboardingNavigation()
  const {
    state: { statuses },
    dispatch: mainDispatch
  } = useController('MainController')
  const { state: hasPasswordSecret } = useController('KeystoreController', 'hasPasswordSecret')
  const { getExtraEntropy } = useExtraEntropy()
  const [isCreating, setIsCreating] = useState(false)
  // The account picker may already hold init params from an abandoned flow, so waiting
  // for them to appear is not enough. The status tells us the background is done.
  const hasSeenLoading = useRef(false)

  const createNewSeedAccount = useCallback(() => {
    hasSeenLoading.current = false
    setIsCreating(true)
    mainDispatch({
      type: 'method',
      params: {
        method: 'accountPickerSetInitParamsFromNewSeed',
        args: [{ extraEntropy: getExtraEntropy() }]
      }
    })
  }, [getExtraEntropy, mainDispatch])

  useEffect(() => {
    if (!isCreating) return

    if (statuses.accountPickerSetInitParamsFromNewSeed === 'LOADING') {
      hasSeenLoading.current = true
      return
    }

    if (!hasSeenLoading.current) return

    setIsCreating(false)

    if (statuses.accountPickerSetInitParamsFromNewSeed === 'ERROR') return

    goToNextRoute(hasPasswordSecret ? WEB_ROUTES.accountPersonalize : WEB_ROUTES.keyStoreSetup)
  }, [goToNextRoute, hasPasswordSecret, isCreating, statuses.accountPickerSetInitParamsFromNewSeed])

  return { createNewSeedAccount, isCreating }
}
