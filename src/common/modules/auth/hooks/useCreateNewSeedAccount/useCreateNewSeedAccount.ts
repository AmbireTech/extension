import { useCallback, useState } from 'react'

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
  const { dispatchAndWait: mainDispatchAndWait } = useController('MainController')
  const { getExtraEntropy } = useExtraEntropy()
  const [isCreating, setIsCreating] = useState(false)

  // Awaits the controller's reply rather than watching its transient status, which a
  // screen that is not subscribed yet (right after navigating back to it) never sees.
  const createNewSeedAccount = useCallback(async () => {
    setIsCreating(true)
    try {
      await mainDispatchAndWait({
        type: 'method',
        params: {
          method: 'accountPickerSetInitParamsFromNewSeed',
          args: [{ extraEntropy: getExtraEntropy() }]
        }
      })
      goToNextRoute(WEB_ROUTES.accountPersonalize)
    } catch (error) {
      // The controller reports its own failures, here the button only becomes usable again
      console.error('Failed to create a new recovery phrase', error)
    } finally {
      setIsCreating(false)
    }
  }, [getExtraEntropy, goToNextRoute, mainDispatchAndWait])

  return { createNewSeedAccount, isCreating }
}
