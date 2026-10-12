import { AllControllersMappingType } from '@common/constants/controllersMapping'
import { selectIsSidePanelModeEnabled } from '@common/controllers/wallet-state/selectors'
import useController from '@common/hooks/useController'
import { getUiType } from '@common/utils/uiType'
import { isFirefoxSidebar } from '@web/utils/sidePanel'

const { isSidePanel } = getUiType()

const selectRequestWindow = (state: AllControllersMappingType['RequestsController']) =>
  state.requestWindow

/**
 * Whether an action request should be rendered in the side panel. It is not when a request window
 * already owns the request: the window opened before the panel, so the panel would otherwise show
 * the same request a second time. Opening such a request (`setCurrentUserRequestById`) makes the
 * background close the window and leave the request to the panel.
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
