import { useCallback } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics.web'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { engine } from '@web/constants/browserapi'
import { openFirefoxSidebarFromUserGesture } from '@web/utils/sidePanel'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectIsSidePanelModeEnabled = (state: AllControllersMappingType['WalletStateController']) =>
  state.isSidePanelModeEnabled

/**
 * Opens the wallet - the popup or the side panel, whichever the toolbar action opens.
 * The returned function must be called directly in a click handler, before any await: Firefox
 * only opens its sidebar during a user gesture, which doesn't survive the message to the
 * background, so the sidebar is opened here and the background is told it was (see
 * OPEN_EXTENSION_POPUP in handleActions.ts). Elsewhere the background opens the wallet itself.
 */
const useOpenWalletFromClick = () => {
  const { dispatch } = useControllersMiddleware()
  const { navigate } = useNavigation()
  const { state: isSidePanelModeEnabled } = useController(
    'WalletStateController',
    selectIsSidePanelModeEnabled
  )

  return useCallback(() => {
    if (engine !== 'gecko' || !isSidePanelModeEnabled) {
      dispatch({ type: 'OPEN_EXTENSION_POPUP' })
      return
    }

    openFirefoxSidebarFromUserGesture()
      .then(() =>
        dispatch({ type: 'OPEN_EXTENSION_POPUP', params: { hasOpenedFirefoxSidebar: true } })
      )
      .catch((error) => {
        console.error('Failed to open the Firefox sidebar, opening the dashboard here', error)
        captureException(error)
        navigate(WEB_ROUTES.dashboard)
      })
  }, [dispatch, isSidePanelModeEnabled, navigate])
}

export default useOpenWalletFromClick
