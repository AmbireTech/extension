import type { ControllersMiddlewareContextReturnType } from '@common/contexts/controllersMiddlewareContext/types'
import { isChromeSidePanelModeEnabled, openChromeSidePanelFromPage } from '@web/utils/sidePanel'

export const openWallet = (dispatch: ControllersMiddlewareContextReturnType['dispatch']) => {
  // Chrome opens its side panel only shortly after a user gesture, which the background can't
  // rely on (it awaits before acting on the message), so the panel is opened from the page -
  // unless it is open already
  isChromeSidePanelModeEnabled()
    .then(async (isPanelMode) => {
      if (!isPanelMode) return false

      await openChromeSidePanelFromPage()
      return true
    })
    .then((isChromeSidePanelOpen) =>
      dispatch({ type: 'OPEN_EXTENSION_POPUP', params: { isChromeSidePanelOpen } })
    )
    .catch((error) => {
      // Expected once the gesture has expired (e.g. a slow add) - the background then opens the
      // dashboard in this tab
      console.warn('Failed to open the side panel from the page', error)
      dispatch({ type: 'OPEN_EXTENSION_POPUP' })
    })
}
