import { useEffect } from 'react'

import useControllerState from '@common/hooks/useControllerState'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import { getUiType } from '@common/utils/uiType'

export default function useRequestsControllerHelpers() {
  const { navigate } = useNavigation()

  const { state } = useControllerState({ id: 'RequestsController' })

  const prevCurrentUserRequestId = usePrevious(state?.currentUserRequest?.id)

  useEffect(() => {
    if (getUiType().isRequestWindow && prevCurrentUserRequestId !== state?.currentUserRequest?.id) {
      setTimeout(() => navigate('/'))
    }
  }, [prevCurrentUserRequestId, state?.currentUserRequest?.id, navigate])
}
