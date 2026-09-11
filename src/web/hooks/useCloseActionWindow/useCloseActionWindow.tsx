import { useCallback } from 'react'

import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import { getUiType } from '@common/utils/uiType'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'

const { isSidePanel } = getUiType()

/**
 * Returns a handler that dismisses an action screen. In the request window it closes the
 * window, which the background picks up. The side panel has no window of its own, so it asks
 * the background to close the request (same queue semantics) and returns to the dashboard.
 */
const useCloseActionWindow = () => {
  const { navigate } = useNavigation()
  const { dispatch: requestsDispatch } = useController('RequestsController')

  return useCallback(() => {
    if (isSidePanel) {
      requestsDispatch({
        type: 'method',
        params: {
          method: 'closeRequestWindow',
          args: []
        }
      })
      navigate(ROUTES.dashboard)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    closeCurrentWindow()
  }, [navigate, requestsDispatch])
}

export default useCloseActionWindow
