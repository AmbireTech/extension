import React, { useCallback } from 'react'

import OneKeyIcon from '@common/assets/svg/OneKeyIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
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

  const onPressConnect = useCallback(async () => {
    if (isSafari() || !isOneKeyWebUsbSupported()) {
      addToast(
        t(
          "Your browser doesn't support WebUSB, which is required for the OneKey device. Please try using a different browser."
        ),
        { type: 'error' }
      )
      return
    }

    try {
      // WebUSB requires the permission prompt to start directly from the user gesture,
      // so it must happen before any state updates.
      const preferredDeviceId = await requestOneKeyDevicePermission()
      // The onboarding navigation moves to the next screen once the account picker is ready
      setTriggeredHwWalletFlow('onekey')
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
    }
  }, [addToast, dispatch, setTriggeredHwWalletFlow, t])

  const isLoading = oneKeyInitStatus === 'LOADING'

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
