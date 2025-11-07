/* eslint-disable react/jsx-no-useless-fragment */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import { isDappRequestAction } from '@ambire-common/libs/actions/actions'
import { getDappIdFromUrl } from '@ambire-common/libs/dapps/helpers'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useDappInfo from '@web/hooks/useDappInfo'
import usePhishingControllerState from '@web/hooks/usePhishingControllerState'
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
  const securityCheckCalled = useRef(false)
  const { dappsBlacklistedStatus } = usePhishingControllerState()
  const [confirmedRiskCheckbox, setConfirmedRiskCheckbox] = useState(false)

  const dappAction = useMemo(
    () => (isDappRequestAction(state.currentAction) ? state.currentAction : null),
    [state.currentAction]
  )

  const userRequest = useMemo(() => {
    if (!dappAction) return undefined
    if (dappAction.userRequest.action.kind !== 'dappConnect') return undefined

    return dappAction.userRequest
  }, [dappAction])

  const { name, icon } = useDappInfo(userRequest)

  const securityCheck = useMemo(() => {
    if (!userRequest?.session?.origin) return 'LOADING'
    const dappId = getDappIdFromUrl(userRequest.session.origin)
    return dappsBlacklistedStatus[dappId]?.status || 'LOADING'
  }, [dappsBlacklistedStatus, userRequest])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      if (!userRequest?.session?.origin) return
      if (securityCheckCalled.current) return

      securityCheckCalled.current = true
      dispatch({
        type: 'PHISHING_CONTROLLER_CHECK_DAPPS_BLACKLISTED_STATUS',
        params: { urls: [userRequest.session.origin] }
      })
    })()
  }, [dispatch, userRequest?.session?.origin])

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
    if (securityCheck === 'LOADING') return t('Loading...')
    if (isAuthorizing) return t('Connecting...')
    if (securityCheck === 'BLACKLISTED') return t('Continue anyway')

    return t('Connect')
  }, [isAuthorizing, securityCheck, t])

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
            securityCheck === 'LOADING' ||
            (securityCheck === 'BLACKLISTED' && !confirmedRiskCheckbox)
          }
          resolveType={securityCheck === 'BLACKLISTED' ? 'error' : 'primary'}
          rejectButtonText={t('Deny')}
          resolveButtonTestID="dapp-connect-button"
        />
      }
    >
      <View style={[styles.container]}>
        <View style={styles.content}>
          <DAppConnectHeader
            name={name}
            id={userRequest?.session?.id}
            icon={icon}
            securityCheck={securityCheck}
            responsiveSizeMultiplier={responsiveSizeMultiplier}
          />
          <DAppConnectBody
            securityCheck={securityCheck}
            responsiveSizeMultiplier={responsiveSizeMultiplier}
            confirmedRiskCheckbox={confirmedRiskCheckbox}
            setConfirmedRiskCheckbox={setConfirmedRiskCheckbox}
          />
        </View>
      </View>
    </TabLayoutContainer>
  )
}

export default React.memo(DappConnectScreen)
