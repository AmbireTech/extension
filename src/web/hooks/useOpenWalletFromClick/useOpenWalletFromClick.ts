import { useCallback } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics.web'
import { selectIsSidePanelModeEnabled } from '@common/controllers/wallet-state/selectors'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { engine } from '@web/constants/browserapi'
import { getFirefoxSidebarApi, openFirefoxSidebarFromUserGesture } from '@web/utils/sidePanel'

/**
 * Opens the wallet - the popup or the side panel, whichever the toolbar action opens.
 * `openWalletFromClick` must be called directly in a click handler, before any await: Firefox
 * only opens its sidebar during a user gesture, which doesn't survive the message to the
 * background, so the sidebar is opened here and the background is told it was (see
 * OPEN_EXTENSION_POPUP in handleActions.ts). Elsewhere the background opens the wallet itself.
 * `canOpenWalletFromClick` is false where that can't work: Firefox can't open the popup from a
 * page, so there only the sidebar (side panel mode) can be opened.
 */
const useOpenWalletFromClick = () => {
  const { dispatch } = useControllersMiddleware()
  const { navigate } = useNavigation()
  const { state: isSidePanelModeEnabled } = useController(
    'WalletStateController',
    selectIsSidePanelModeEnabled
  )

  const canOpenWalletFromClick =
    engine !== 'gecko' || (isSidePanelModeEnabled && !!getFirefoxSidebarApi())

  const openWalletFromClick = useCallback(() => {
    // Without the sidebar API the background is left to show the dashboard in this view instead
    if (engine !== 'gecko' || !isSidePanelModeEnabled || !getFirefoxSidebarApi()) {
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

  return { openWalletFromClick, canOpenWalletFromClick }
}

export default useOpenWalletFromClick
