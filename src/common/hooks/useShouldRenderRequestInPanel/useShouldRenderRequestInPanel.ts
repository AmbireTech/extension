import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import { getUiType } from '@common/utils/uiType'
import { isFirefoxSidebar } from '@web/utils/sidePanel'

const { isSidePanel } = getUiType()

const selectRequestWindow = (state: AllControllersMappingType['RequestsController']) =>
  state.requestWindow

// Also runs from the Router, before every controller state has arrived
const selectIsSidePanelModeEnabled = (
  state: AllControllersMappingType['WalletStateController'] | undefined
) => !!state?.isSidePanelModeEnabled

/**
 * Whether an action request should be rendered in the side panel. It is not when a request window
 * already owns the request: the window opened before the panel and keeps it until it closes, so
 * the panel would otherwise show the same request a second time. Opening such a request only
 * focuses its window (the background does that on `setCurrentUserRequestById`).
 * Nor is it in a Firefox sidebar open while side panel mode is off: it shows the "mode off" notice
 * instead of the wallet, and requests go to a request window then.
 */
const useShouldRenderRequestInPanel = () => {
  const { state: requestWindow } = useController('RequestsController', selectRequestWindow)
  const { state: isSidePanelModeEnabled } = useController(
    'WalletStateController',
    selectIsSidePanelModeEnabled
  )

  const isShowingModeOffNotice = isFirefoxSidebar && !isSidePanelModeEnabled

  return isSidePanel && !requestWindow?.windowProps && !isShowingModeOffNotice
}

export default useShouldRenderRequestInPanel
