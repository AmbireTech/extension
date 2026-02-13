import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

import { ControllerStore } from '@common/contexts/controllerStoreContext/controllerStore'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import { getUiType } from '@web/utils/uiType'

export default function useRequestsControllerHelpers(controllerStore: ControllerStore) {
  const { navigate } = useNavigation()

  const state = useSyncExternalStore(
    useCallback((cb) => controllerStore.subscribe('RequestsController', cb), [controllerStore]),
    useCallback(() => controllerStore.getSnapshot('RequestsController'), [controllerStore])
  )

  const prevCurrentUserRequestId = usePrevious(state?.currentUserRequest?.id)

  useEffect(() => {
    if (getUiType().isRequestWindow && prevCurrentUserRequestId !== state?.currentUserRequest?.id) {
      setTimeout(() => navigate('/'))
    }
  }, [prevCurrentUserRequestId, state?.currentUserRequest?.id, navigate])
}
