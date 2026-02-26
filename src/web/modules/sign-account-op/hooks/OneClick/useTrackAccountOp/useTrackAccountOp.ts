import { useMemo } from 'react'

import useController from '@common/hooks/useController'

type Props = {
  address?: string
  chainId?: bigint
  sessionId: string
}

const useTrackAccountOp = ({ address, chainId, sessionId }: Props) => {
  const { dispatch: activityDispatch } = useController('ActivityController')

  const sessionHandler = useMemo(() => {
    return {
      initSession: () => {
        if (!address || !chainId) return

        activityDispatch({
          type: 'method',
          params: {
            method: 'filterAccountsOps',
            args: [
              sessionId,
              {
                account: address,
                chainId
              },
              {
                itemsPerPage: 10,
                fromPage: 0
              }
            ]
          }
        })
      },
      killSession: () => {
        activityDispatch({
          type: 'method',
          params: {
            method: 'resetAccountsOpsFilters',
            args: [sessionId]
          }
        })
      }
    }
  }, [address, chainId, activityDispatch, sessionId])

  return { sessionHandler }
}

export default useTrackAccountOp
