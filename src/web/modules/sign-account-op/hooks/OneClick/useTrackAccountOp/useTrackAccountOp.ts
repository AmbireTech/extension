import { useMemo } from 'react'

import useBackgroundService from '@web/hooks/useBackgroundService'

type Props = {
  address?: string
  chainId?: bigint
  sessionId: string
}

const useTrackAccountOp = ({ address, chainId, sessionId }: Props) => {
  const { dispatch } = useBackgroundService()

  const sessionHandler = useMemo(() => {
    return {
      initSession: () => {
        if (!address || !chainId) return

        dispatch({
          type: 'MAIN_CONTROLLER_ACTIVITY_SET_ACC_OPS_FILTERS',
          params: {
            sessionId,
            filters: {
              account: address,
              chainId
            },
            pagination: {
              itemsPerPage: 10,
              fromPage: 0
            }
          }
        })
      },
      killSession: () => {
        dispatch({
          type: 'MAIN_CONTROLLER_ACTIVITY_RESET_ACC_OPS_FILTERS',
          params: { sessionId }
        })
      }
    }
  }, [address, chainId, dispatch, sessionId])

  return { sessionHandler }
}

export default useTrackAccountOp
