import { useCallback } from 'react'

import useController from '@common/hooks/useController'

/**
 * Marks an app hosted on a shared platform as trusted, or takes that back. Trusting silences the
 * suspicious-hosting warning for that app alone; the controller refuses apps that share their
 * hostname with the rest of the platform, so read `canBeTrustedByUser` on the app before offering
 * the action.
 */
const useTrustDapp = () => {
  const { dispatch } = useController('DappsController')

  const trustDapp = useCallback(
    (url: string) => {
      dispatch({ type: 'method', params: { method: 'trustDapp', args: [url] } })
    },
    [dispatch]
  )

  const untrustDapp = useCallback(
    (id: string) => {
      dispatch({ type: 'method', params: { method: 'untrustDapp', args: [id] } })
    },
    [dispatch]
  )

  return { trustDapp, untrustDapp }
}

export default useTrustDapp
