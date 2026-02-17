/* eslint-disable react/jsx-no-useless-fragment */
import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

import HoldToProceedButton from '@common/components/HoldToProceedButton'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithLogoOnly } from '@common/modules/header/components/Header/Header'
import spacings from '@common/styles/spacings'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useResponsiveActionWindow from '@web/hooks/useResponsiveActionWindow'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'

import DAppConnectBody from './components/DAppConnectBody'
import DAppConnectHeader from './components/DAppConnectHeader'
import getStyles from './styles'

// Screen for dApps authorization to connect to extension - will be triggered on dApp connect request
const DappConnectScreen = () => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { dispatch } = useControllersMiddleware()
  const { currentUserRequest } = useController('RequestsController').state

  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const { responsiveSizeMultiplier } = useResponsiveActionWindow()
  const { state: dappsState } = useController('DappsController')

  const dappToConnect = useMemo(() => dappsState.dappToConnect || null, [dappsState.dappToConnect])

  const userRequest = useMemo(
    () => (currentUserRequest?.kind === 'dappConnect' ? currentUserRequest : undefined),
    [currentUserRequest]
  )

  const handleDenyButtonPress = useCallback(() => {
    if (!userRequest) return

    dispatch({
      type: 'REQUESTS_CONTROLLER_REJECT_USER_REQUEST',
      params: { err: t('User rejected the request.'), id: userRequest.id }
    })
  }, [userRequest, t, dispatch])

  const handleAuthorizeButtonPress = useCallback(() => {
    if (!userRequest) return

    setIsAuthorizing(true)
    dispatch({
      type: 'REQUESTS_CONTROLLER_RESOLVE_USER_REQUEST',
      params: { data: dappToConnect, id: userRequest.id }
    })
  }, [userRequest, dappToConnect, dispatch])

  const shouldHoldToProceed = useMemo(() => {
    return (
      !!dappToConnect &&
      (dappToConnect.blacklisted === 'BLACKLISTED' || dappToConnect.blacklisted === 'FAILED_TO_GET')
    )
  }, [dappToConnect])

  const resolveButtonText = useMemo(() => {
    if (!dappToConnect || dappToConnect.blacklisted === 'LOADING') return t('Loading...')
    if (isAuthorizing) return t('Connecting...')
    if (dappToConnect.blacklisted === 'BLACKLISTED') return t('Hold to continue anyway')

    return shouldHoldToProceed ? t('Hold to connect') : t('Connect')
  }, [dappToConnect, t, isAuthorizing, shouldHoldToProceed])

  return (
    <TabLayoutContainer
      width="full"
      header={<HeaderWithLogoOnly />}
      renderDirectChildren={() => (
        <ActionFooter
          onReject={handleDenyButtonPress}
          onResolve={!shouldHoldToProceed ? handleAuthorizeButtonPress : () => {}}
          resolveNode={
            shouldHoldToProceed ? (
              <HoldToProceedButton
                testID="dapp-connect-button"
                onHoldComplete={handleAuthorizeButtonPress}
                holdDuration={1600}
                style={{ height: 56 }}
                text={resolveButtonText}
                buttonType={((): 'error' | 'warning' => {
                  if (!!dappToConnect && dappToConnect.blacklisted === 'BLACKLISTED') return 'error'
                  return 'warning'
                })()}
              />
            ) : undefined
          }
          resolveButtonText={!shouldHoldToProceed ? resolveButtonText : undefined}
          resolveDisabled={
            !shouldHoldToProceed
              ? isAuthorizing || (!!dappToConnect && dappToConnect.blacklisted === 'LOADING')
              : undefined
          }
          resolveType={!shouldHoldToProceed ? 'primary' : undefined}
          rejectButtonText={t('Deny')}
          resolveButtonTestID={!shouldHoldToProceed ? 'dapp-connect-button' : undefined}
        />
      )}
      style={spacings.ptXl}
    >
      {!!dappToConnect && (
        <View style={[styles.container]}>
          <View style={styles.content}>
            <DAppConnectHeader
              name={dappToConnect.name}
              id={dappToConnect.id}
              icon={dappToConnect.icon!}
              securityCheck={dappToConnect.blacklisted}
              responsiveSizeMultiplier={responsiveSizeMultiplier}
            />
            <DAppConnectBody
              securityCheck={dappToConnect.blacklisted}
              responsiveSizeMultiplier={responsiveSizeMultiplier}
            />
          </View>
        </View>
      )}
    </TabLayoutContainer>
  )
}

export default DappConnectScreen
