import { useCallback, useMemo, useState } from 'react'

import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'

const useDappConnect = () => {
  const { t } = useTranslation()
  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')

  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const { state: dappsState } = useController('DappsController')

  const dappToConnect = useMemo(() => dappsState.dappToConnect || null, [dappsState.dappToConnect])

  const userRequest = useMemo(
    () => (currentUserRequest?.kind === 'dappConnect' ? currentUserRequest : undefined),
    [currentUserRequest]
  )

  const handleDenyButtonPress = useCallback(() => {
    if (!userRequest) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'rejectUserRequests',
        args: [t('User rejected the request.'), [userRequest.id]]
      }
    })
  }, [userRequest, t, requestsDispatch])

  const handleAuthorizeButtonPress = useCallback(() => {
    if (!userRequest) return

    setIsAuthorizing(true)
    requestsDispatch({
      type: 'method',
      params: {
        method: 'resolveUserRequest',
        args: [dappToConnect, userRequest.id]
      }
    })
  }, [userRequest, dappToConnect, requestsDispatch])

  const shouldHoldToProceed = useMemo(() => {
    return (
      !!dappToConnect &&
      (dappToConnect.blacklisted === 'BLACKLISTED' ||
        dappToConnect.blacklisted === 'SUSPICIOUS_HOSTING' ||
        dappToConnect.blacklisted === 'FAILED_TO_GET')
    )
  }, [dappToConnect])

  const resolveButtonText = useMemo(() => {
    if (!dappToConnect || dappToConnect.blacklisted === 'LOADING') return t('Loading...')
    if (isAuthorizing) return t('Connecting...')
    if (
      dappToConnect.blacklisted === 'BLACKLISTED' ||
      dappToConnect.blacklisted === 'SUSPICIOUS_HOSTING'
    )
      return t('Hold to continue anyway')

    return shouldHoldToProceed ? t('Hold to connect') : t('Connect')
  }, [dappToConnect, t, isAuthorizing, shouldHoldToProceed])

  return {
    t,
    dappToConnect,
    userRequest,
    isAuthorizing,
    handleDenyButtonPress,
    handleAuthorizeButtonPress,
    shouldHoldToProceed,
    resolveButtonText
  }
}

export default useDappConnect
