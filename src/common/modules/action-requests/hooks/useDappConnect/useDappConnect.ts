import { useCallback, useMemo, useState } from 'react'

import type { FeatureFlagsController } from '@ambire-common/controllers/featureFlags/featureFlags'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTrustDapp from '@common/hooks/useTrustDapp'

const selectIsScamCheckerEnabled = (state: FeatureFlagsController) =>
  state.flags.scamAndPhishingChecker

const useDappConnect = () => {
  const { t } = useTranslation()
  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')

  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const { state: dappsState } = useController('DappsController')
  const { state: isScamCheckerEnabled, dispatch: featureFlagsDispatch } = useController(
    'FeatureFlagsController',
    selectIsScamCheckerEnabled
  )
  const { trustDapp, untrustDapp } = useTrustDapp()

  const dappToConnect = useMemo(() => dappsState.dappToConnect || null, [dappsState.dappToConnect])

  // Both flags are only ever set on an app the hosting check flagged, so the suspicious-hosting
  // warning is the only thing they speak about.
  const isTrustedByUser = !!dappToConnect?.isTrustedByUser
  const canBeTrustedByUser = !!dappToConnect?.canBeTrustedByUser

  const isSuspiciousHosting =
    isScamCheckerEnabled && dappToConnect?.blacklisted === 'SUSPICIOUS_HOSTING' && !isTrustedByUser

  const toggleTrust = useCallback(() => {
    if (!dappToConnect) return

    if (isTrustedByUser) {
      untrustDapp(dappToConnect.id)
      return
    }

    trustDapp(dappToConnect.url)
  }, [dappToConnect, isTrustedByUser, trustDapp, untrustDapp])

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

  const handleEnableScamChecker = useCallback(() => {
    featureFlagsDispatch({
      type: 'method',
      params: {
        method: 'setFeatureFlags',
        args: [{ scamAndPhishingChecker: true }]
      }
    })
  }, [featureFlagsDispatch])

  const shouldHoldToProceed = useMemo(() => {
    return (
      !!dappToConnect &&
      isScamCheckerEnabled &&
      (dappToConnect.blacklisted === 'BLACKLISTED' ||
        isSuspiciousHosting ||
        dappToConnect.blacklisted === 'FAILED_TO_GET')
    )
  }, [dappToConnect, isScamCheckerEnabled, isSuspiciousHosting])

  const resolveButtonText = useMemo(() => {
    if (!dappToConnect) return t('Loading...')
    if (isAuthorizing) return t('Connecting...')
    if (!isScamCheckerEnabled) return t('Connect')
    if (dappToConnect.blacklisted === 'BLACKLISTED' || isSuspiciousHosting)
      return t('Hold to continue anyway')
    if (dappToConnect.blacklisted === 'LOADING') return t('Loading...')

    return shouldHoldToProceed ? t('Hold to connect') : t('Connect')
  }, [
    dappToConnect,
    t,
    isAuthorizing,
    shouldHoldToProceed,
    isSuspiciousHosting,
    isScamCheckerEnabled
  ])

  return {
    t,
    dappToConnect,
    userRequest,
    isAuthorizing,
    handleDenyButtonPress,
    handleAuthorizeButtonPress,
    shouldHoldToProceed,
    resolveButtonText,
    isTrustedByUser,
    canBeTrustedByUser,
    isScamCheckerEnabled,
    handleEnableScamChecker,
    toggleTrust
  }
}

export default useDappConnect
