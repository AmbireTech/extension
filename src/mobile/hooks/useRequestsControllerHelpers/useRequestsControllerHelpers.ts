import { useEffect } from 'react'

import useControllerState from '@common/hooks/useControllerState'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import { getInitialRoute } from '@common/modules/router/helpers'
import { getUiType } from '@common/utils/uiType'
import { MobileBaseControllersMappingType } from '@mobile/constants/controllersMapping'

export default function useRequestsControllerHelpers(
  controllers: MobileBaseControllersMappingType
) {
  const { navigate } = useNavigation()

  const { state: requestsState } = useControllerState({ id: 'RequestsController' })
  const { state: keystoreState } = useControllerState({ id: 'KeystoreController' })
  const { state: swapAndBridgeState } = useControllerState({ id: 'SwapAndBridgeController' })
  const { state: transferState } = useControllerState({ id: 'TransferController' })

  const prevCurrentUserRequestId = usePrevious(requestsState?.currentUserRequest?.id)

  const route = useRoute()
  const currentPathname = route.pathname.startsWith('/') ? route.pathname.slice(1) : route.pathname
  const prevPathname = usePrevious(currentPathname)

  useEffect(() => {
    const wasOnActionRequestScreen =
      prevPathname === ROUTES.signAccountOp || prevPathname === ROUTES.benzin
    const isOnActionRequestScreen =
      currentPathname === ROUTES.signAccountOp || currentPathname === ROUTES.benzin

    if (wasOnActionRequestScreen && !isOnActionRequestScreen) {
      if (controllers?.MainController?.ui?.window?.event) {
        controllers.MainController.ui.window.event.emit('windowRemoved', 1)
      }
    }
  }, [currentPathname, prevPathname, controllers])

  useEffect(() => {
    if (
      (getUiType().isRequestWindow || getUiType().isMobileApp) &&
      prevCurrentUserRequestId !== requestsState?.currentUserRequest?.id
    ) {
      setTimeout(() => {
        const initialRoute = getInitialRoute({
          keystoreState,
          requestsState,
          swapAndBridgeState,
          transferState
        })
        if (initialRoute) navigate(initialRoute)
      })
    }
  }, [
    prevCurrentUserRequestId,
    requestsState?.currentUserRequest?.id,
    navigate,
    keystoreState,
    requestsState,
    swapAndBridgeState,
    transferState
  ])
}
