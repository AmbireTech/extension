/* eslint-disable react/jsx-no-useless-fragment */
import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

import { isDappRequestAction } from '@ambire-common/libs/actions/actions'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useDappsControllerState from '@web/hooks/useDappsControllerState'
import useResponsiveActionWindow from '@web/hooks/useResponsiveActionWindow'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'

import DAppConnectBody from './components/DAppConnectBody'
import DAppConnectHeader from './components/DAppConnectHeader'
import getStyles from './styles'

// Screen for dApps authorization to connect to extension - will be triggered on dApp connect request
const DappConnectScreen = () => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { dispatch } = useBackgroundService()
  const state = useActionsControllerState()

  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const { responsiveSizeMultiplier } = useResponsiveActionWindow()
  const [confirmedRiskCheckbox, setConfirmedRiskCheckbox] = useState(false)
  const { state: dappsState } = useDappsControllerState()

  const dappToConnect = useMemo(() => dappsState.dappToConnect || null, [dappsState])

  const dappAction = useMemo(
    () => (isDappRequestAction(state.currentAction) ? state.currentAction : null),
    [state.currentAction]
  )

  const handleDenyButtonPress = useCallback(() => {
    if (!dappAction) return

    dispatch({
      type: 'REQUESTS_CONTROLLER_REJECT_USER_REQUEST',
      params: { err: t('User rejected the request.'), id: dappAction.id }
    })
  }, [dappAction, t, dispatch])

  const handleAuthorizeButtonPress = useCallback(() => {
    if (!dappAction) return

    setIsAuthorizing(true)
    dispatch({
      type: 'REQUESTS_CONTROLLER_RESOLVE_USER_REQUEST',
      params: { data: null, id: dappAction.id }
    })
  }, [dappAction, dispatch])

  const resolveButtonText = useMemo(() => {
    if (!dappToConnect || dappToConnect.blacklisted === 'LOADING') return t('Loading...')
    if (isAuthorizing) return t('Connecting...')
    if (dappToConnect.blacklisted === 'BLACKLISTED') return t('Continue anyway')

    return t('Connect')
  }, [isAuthorizing, dappToConnect, t])

  return (
    <TabLayoutContainer
      width="full"
      backgroundColor={theme.quinaryBackground}
      header={
        <Header
          mode="custom-inner-content"
          withAmbireLogo
          backgroundColor={theme.quinaryBackground as string}
        />
      }
      footer={
        <ActionFooter
          onReject={handleDenyButtonPress}
          onResolve={handleAuthorizeButtonPress}
          resolveButtonText={resolveButtonText}
          resolveDisabled={
            isAuthorizing ||
            (!!dappToConnect && dappToConnect.blacklisted === 'LOADING') ||
            (!!dappToConnect &&
              dappToConnect.blacklisted === 'BLACKLISTED' &&
              !confirmedRiskCheckbox)
          }
          resolveType={
            !!dappToConnect && dappToConnect.blacklisted === 'BLACKLISTED' ? 'error' : 'primary'
          }
          rejectButtonText={t('Deny')}
          resolveButtonTestID="dapp-connect-button"
        />
      }
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
              confirmedRiskCheckbox={confirmedRiskCheckbox}
              setConfirmedRiskCheckbox={setConfirmedRiskCheckbox}
            />
          </View>
        </View>
      )}
    </TabLayoutContainer>
  )
}

export default DappConnectScreen
