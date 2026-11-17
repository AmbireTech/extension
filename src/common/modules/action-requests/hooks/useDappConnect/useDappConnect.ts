import { useCallback, useMemo, useState } from 'react'

import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'
import { getImpersonation } from '@ambire-common/libs/dapps/impersonation'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTrustDapp from '@common/hooks/useTrustDapp'

const selectIsScamCheckerEnabled = (state: IFeatureFlagsController) =>
  state.flags.scamAndPhishingChecker

const useDappConnect = () => {
  const { t } = useTranslation()
  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')

  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const { state: dappsState, dispatch: dappsDispatch } = useController('DappsController')
  const { state: isScamCheckerEnabled } = useController(
    'FeatureFlagsController',
    selectIsScamCheckerEnabled
  )
  const { trustDapp, untrustDapp } = useTrustDapp()

  const dappToConnect = useMemo(() => dappsState.dappToConnect || null, [dappsState.dappToConnect])
  const websiteContentUpdate = dappsState.dappToConnectWebsiteContentUpdate
  const connectedApps = useMemo(
    () =>
      dappsState.dapps.filter((dapp) => dapp.isConnected).map(({ name, url }) => ({ name, url })),
    [dappsState.dapps]
  )

  // Both flags are only ever set on an app the hosting check flagged, so the suspicious-hosting
  // warning is the only thing they speak about.
  const isTrustedByUser = !!dappToConnect?.isTrustedByUser
  const canBeTrustedByUser = !!dappToConnect?.canBeTrustedByUser

  const isSuspiciousHosting =
    isScamCheckerEnabled && dappToConnect?.blacklisted === 'SUSPICIOUS_HOSTING' && !isTrustedByUser

  // Checked once the scam lists are, as a site that is already on them gets the stronger warning.
  // Not tied to the scam checker - it can be turned off to avoid its network requests, while this
  // check runs fully on the device.
  const impersonation = useMemo(() => {
    if (!dappToConnect) return null
    if (dappToConnect.blacklisted === 'LOADING' || dappToConnect.blacklisted === 'BLACKLISTED') {
      return null
    }

    return getImpersonation({
      hostname: dappToConnect.id,
      name: dappToConnect.name,
      icon: dappToConnect.icon,
      isInAppCatalog: !dappToConnect.isCustom,
      connectedApps
    })
  }, [dappToConnect, connectedApps])

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
    dappsDispatch({
      type: 'method',
      params: {
        method: 'enableScamCheckerAndRefreshDappToConnect',
        args: []
      }
    })
  }, [dappsDispatch])

  const shouldHoldToProceed = useMemo(() => {
    if (!dappToConnect) return false
    if (impersonation) return true

    return (
      isScamCheckerEnabled &&
      (dappToConnect.blacklisted === 'BLACKLISTED' ||
        isSuspiciousHosting ||
        dappToConnect.blacklisted === 'FAILED_TO_GET')
    )
  }, [dappToConnect, isScamCheckerEnabled, isSuspiciousHosting, impersonation])

  const resolveButtonText = useMemo(() => {
    if (!dappToConnect) return t('Loading...')
    if (isAuthorizing) return t('Connecting...')
    if (impersonation) return t('Hold to continue anyway')
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
    isScamCheckerEnabled,
    impersonation
  ])

  return {
    t,
    dappToConnect,
    websiteContentUpdate,
    userRequest,
    isAuthorizing,
    handleDenyButtonPress,
    handleAuthorizeButtonPress,
    shouldHoldToProceed,
    resolveButtonText,
    isTrustedByUser,
    canBeTrustedByUser,
    isScamCheckerEnabled,
    impersonation,
    handleEnableScamChecker,
    toggleTrust
  }
}

export default useDappConnect
