import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import { getUiType } from '@common/utils/uiType'

const { isSidePanel } = getUiType()

const selectRequestWindow = (state: AllControllersMappingType['RequestsController']) =>
  state.requestWindow

/**
 * Whether an action request should be rendered in the side panel. It is not when a request window
 * already owns the request: the window opened before the panel and keeps it until it closes, so
 * the panel would otherwise show the same request a second time. Opening such a request only
 * focuses its window (the background does that on `setCurrentUserRequestById`).
 */
const useShouldRenderRequestInPanel = () => {
  const { state: requestWindow } = useController('RequestsController', selectRequestWindow)

  return isSidePanel && !requestWindow?.windowProps
}

export default useShouldRenderRequestInPanel
