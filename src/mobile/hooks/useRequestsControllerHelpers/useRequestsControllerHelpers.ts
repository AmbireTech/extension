import { useEffect } from 'react'

import useControllerState from '@common/hooks/useControllerState'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import { getInitialRoute } from '@common/modules/router/helpers'
import { getUiType } from '@common/utils/uiType'

export default function useRequestsControllerHelpers() {
  const { navigate } = useNavigation()

  const { state: requestsState } = useControllerState({ id: 'RequestsController' })
  const { state: keystoreState } = useControllerState({ id: 'KeystoreController' })
  const { state: swapAndBridgeState } = useControllerState({ id: 'SwapAndBridgeController' })
  const { state: transferState } = useControllerState({ id: 'TransferController' })

  const prevCurrentUserRequestId = usePrevious(requestsState?.currentUserRequest?.id)

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
  }, [prevCurrentUserRequestId, requestsState?.currentUserRequest?.id, navigate])
}
