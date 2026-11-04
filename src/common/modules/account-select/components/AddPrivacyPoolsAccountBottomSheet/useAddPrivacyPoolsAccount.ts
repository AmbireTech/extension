import { useCallback } from 'react'

import useController from '@common/hooks/useController'
import useExtraEntropy from '@common/hooks/useExtraEntropy'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

/**
 * Sets a Privacy Pools account flow up, from a stored recovery phrase or a new one, and moves on
 * to the personalize step at once - it prepares the account behind its loading state, lets the
 * user name it, and adds it once the user proceeds.
 */
const useAddPrivacyPoolsAccount = () => {
  const { dispatch: accountPickerDispatch } = useController('AccountPickerController')
  const { goToNextRoute } = useOnboardingNavigation()
  const { getExtraEntropy } = useExtraEntropy()

  const startFlow = useCallback(
    (params: { seedId?: string; extraEntropy?: string }) => {
      accountPickerDispatch({
        type: 'method',
        params: { method: 'setPrivacyPoolsInitParams', args: [params] }
      })
      goToNextRoute(WEB_ROUTES.accountPersonalize)
    },
    [accountPickerDispatch, goToNextRoute]
  )

  const addFromStoredSeed = useCallback((seedId: string) => startFlow({ seedId }), [startFlow])

  const addFromNewSeed = useCallback(
    () => startFlow({ extraEntropy: getExtraEntropy() }),
    [getExtraEntropy, startFlow]
  )

  return { addFromStoredSeed, addFromNewSeed }
}

export default useAddPrivacyPoolsAccount
