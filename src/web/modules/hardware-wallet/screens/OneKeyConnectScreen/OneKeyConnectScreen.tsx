import React, { useCallback, useMemo, useRef, useState } from 'react'

import OneKeyIcon from '@common/assets/svg/OneKeyIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import requestOneKeyDevicePermission, {
  isOneKeyWebUsbSupported
} from '@common/modules/hardware-wallets/onekey/requestOneKeyDevicePermission'
import spacings from '@common/styles/spacings'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { isSafari } from '@web/constants/browserapi'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectOneKeyInitStatus = (state: AllControllersMappingType['MainController']) =>
  state.statuses.handleAccountPickerInitOneKey

const OneKeyConnectScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { dispatch } = useControllersMiddleware()
  const { goToPrevRoute, setTriggeredHwWalletFlow } = useOnboardingNavigation()
  const { state: oneKeyInitStatus } = useController('MainController', selectOneKeyInitStatus)
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { search } = useRoute()
  // Opened from a signing flow that couldn't reach the device, rather than to import accounts
  const { isReauthorization, requestId } = useMemo(() => {
    const params = new URLSearchParams(search)
    return {
      isReauthorization: params.get('isReauthorization') === 'true',
      requestId: params.get('requestId')
    }
  }, [search])
  // Blocks a second press while the first one is still running, without a re-render that
  // could happen before the browser's device prompt opens
  const isPressInProgressRef = useRef(false)
  // Covers the moment between dispatching the init and the controller reporting it's loading
  const [isWaitingForInit, setIsWaitingForInit] = useState(false)
  const [prevOneKeyInitStatus, setPrevOneKeyInitStatus] = useState(oneKeyInitStatus)
  if (oneKeyInitStatus !== prevOneKeyInitStatus) {
    setPrevOneKeyInitStatus(oneKeyInitStatus)
    if (oneKeyInitStatus !== 'INITIAL') setIsWaitingForInit(false)
  }

  const onPressConnect = useCallback(async () => {
    if (isPressInProgressRef.current) return

    if (isSafari() || !isOneKeyWebUsbSupported()) {
      addToast(
        t(
          "Your browser doesn't support WebUSB, which is required for the OneKey device. Please try using a different browser."
        ),
        { type: 'error' }
      )
      return
    }

    isPressInProgressRef.current = true
    try {
      // WebUSB requires the permission prompt to start directly from the user gesture,
      // so it must happen before any state updates.
      const preferredDeviceId = await requestOneKeyDevicePermission()

      if (isReauthorization) {
        // Bring the user back to the request that needs the device
        if (requestId) {
          requestsDispatch({
            type: 'method',
            params: { method: 'setCurrentUserRequestById', args: [requestId] }
          })
        }
        await closeCurrentWindow()
        return
      }

      // The onboarding navigation moves to the next screen once the account picker is ready
      setTriggeredHwWalletFlow('onekey')
      setIsWaitingForInit(true)
      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_ONEKEY',
        params: { preferredDeviceId }
      })
    } catch (error: any) {
      const message =
        error?.name === 'NotFoundError'
          ? t('No OneKey device was selected. Connect and unlock it, then try again.')
          : error?.message || t('Could not connect to the OneKey device.')
      addToast(message, { type: error?.name === 'NotFoundError' ? 'warning' : 'error' })
    } finally {
      isPressInProgressRef.current = false
    }
  }, [
    addToast,
    dispatch,
    isReauthorization,
    requestId,
    requestsDispatch,
    setTriggeredHwWalletFlow,
    t
  ])

  const isLoading = isWaitingForInit || oneKeyInitStatus === 'LOADING'

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent>
        <Panel
          spacingsSize="small"
          type="onboarding"
          withBackButton
          onBackButtonPress={goToPrevRoute}
          title={t('Connect OneKey')}
        >
          <OneKeyIcon style={{ alignSelf: 'center', marginBottom: 124 }} width={96} height={96} />
          <Text weight="medium" style={spacings.mbSm} fontSize={14}>
            {t('1. Plug in your OneKey with a USB cable and unlock it.')}
          </Text>
          <Text weight="medium" fontSize={14} style={spacings.mbXl}>
            {t('2. Close the OneKey app and other wallets that might be using it.')}
          </Text>
          <Text style={spacings.mbXl} fontSize={14} appearance="secondaryText">
            {t(
              'If you haven’t done it before, your browser will ask you to choose the device Ambire can connect to.'
            )}
          </Text>
          <Button
            text={isLoading ? t('Connecting...') : t('Authorize & connect')}
            disabled={isLoading}
            onPress={onPressConnect}
            hasBottomSpacing={false}
          />
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(OneKeyConnectScreen)
