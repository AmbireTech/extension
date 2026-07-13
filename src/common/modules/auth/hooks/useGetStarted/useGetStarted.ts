import { useCallback, useEffect } from 'react'

import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { ROUTES } from '@common/modules/router/constants/common'

export default function useGetStarted() {
  const { authStatus } = useAuth()
  const { navigate } = useNavigation()

  const { goToNextRoute } = useOnboardingNavigation()
  const { state, dispatch: walletStateDispatch } = useController('WalletStateController')
  const resetIsSetupCompleteIfNeeded = useCallback(() => {
    if (authStatus === AUTH_STATUS.NOT_AUTHENTICATED && !state.isPinned && state.isSetupComplete) {
      walletStateDispatch({
        type: 'method',
        params: {
          method: 'setIsSetupComplete',
          args: [false]
        }
      })
    }
  }, [authStatus, walletStateDispatch, state.isPinned, state.isSetupComplete])

  useEffect(() => {
    if (authStatus === AUTH_STATUS.AUTHENTICATED) {
      navigate(ROUTES.dashboard)
      return
    }

    resetIsSetupCompleteIfNeeded()
  }, [authStatus, navigate, resetIsSetupCompleteIfNeeded])

  const handleAuthButtonPress = useCallback(
    async (flow: 'create-new-account' | 'import-existing-account' | 'view-only') => {
      if (flow === 'create-new-account') {
        goToNextRoute(ROUTES.createSeedPhrasePrepare)
        return
      }
      if (flow === 'import-existing-account') {
        goToNextRoute(ROUTES.importExistingAccount)
        return
      }
      if (flow === 'view-only') {
        goToNextRoute(ROUTES.viewOnlyAccountAdder)
      }
    },
    [goToNextRoute]
  )

  return {
    handleAuthButtonPress
  }
}
