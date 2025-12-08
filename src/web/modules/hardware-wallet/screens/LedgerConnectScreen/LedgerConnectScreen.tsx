import React, { useEffect, useState } from 'react'
import { View } from 'react-native'

import AmbireDevice from '@common/assets/svg/AmbireDevice'
import DriveIcon from '@common/assets/svg/DriveIcon'
import LeftPointerArrowIcon from '@common/assets/svg/LeftPointerArrowIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useWindowSize from '@common/hooks/useWindowSize'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import useAccountPickerControllerState from '@web/hooks/useAccountPickerControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useLedger from '@web/modules/hardware-wallet/hooks/useLedger'

export const CARD_WIDTH = 400

const LedgerConnectScreen = () => {
  const mainCtrlState = useMainControllerState()
  const { requestLedgerDeviceAccess } = useLedger()
  const { addToast } = useToast()
  const { t } = useTranslation()
  const [isGrantingPermission, setIsGrantingPermission] = useState(false)
  const { theme } = useTheme()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { dispatch } = useBackgroundService()
  const { initParams, type } = useAccountPickerControllerState()
  const [authorizeButtonPressed, setAuthorizeButtonPressed] = useState(false)
  const route = useRoute()
  const { minHeightSize } = useWindowSize()

  const onPressNext = async () => {
    try {
      // Request Ledger access first, before any state updates to prevent error:
      // "Failed to execute 'requestDevice' on 'HID': Must be handling a user
      // gesture to show a permission request." on Vivaldi browser.
      await requestLedgerDeviceAccess()

      setIsGrantingPermission(true)
      setAuthorizeButtonPressed(true)

      const params = new URLSearchParams(route?.search)
      const requestId = params.get('requestId')
      if (requestId) {
        dispatch({ type: 'REQUESTS_CONTROLLER_SET_CURRENT_REQUEST_BY_ID', params: { requestId } })
        await closeCurrentWindow()
      } else {
        dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER' })
      }
    } catch (error: any) {
      addToast(error.message, { type: 'error' })
    } finally {
      // Clear the flag to allow the user to try again. For all other cases,
      // the state gets reset automatically, because the on connect success
      // the flow redirects the user to another route (and this component unmounts).
      setIsGrantingPermission(false)
    }
  }

  useEffect(() => {
    if (!!authorizeButtonPressed && initParams && type === 'ledger') {
      setAuthorizeButtonPressed(false)
      goToNextRoute()
    }
  }, [authorizeButtonPressed, goToNextRoute, dispatch, initParams, type])

  const isLoading =
    isGrantingPermission || mainCtrlState.statuses.handleAccountPickerInitLedger === 'LOADING'

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      header={<Header mode="custom-inner-content" withAmbireLogo />}
    >
      <TabLayoutWrapperMainContent>
        <Panel
          spacingsSize="small"
          type="onboarding"
          withBackButton
          onBackButtonPress={goToPrevRoute}
          title={t('Connect Ledger')}
        >
          <View style={[flexbox.alignSelfCenter, spacings.mbSm, spacings.ptMd]}>
            <Text weight="regular" style={spacings.mbTy} fontSize={14}>
              {t('1. Plug in your Ledger and enter a PIN to unlock it.')}
            </Text>
            <Text
              weight="regular"
              fontSize={14}
              style={minHeightSize(620) ? { marginBottom: 12 } : { marginBottom: 40 }}
            >
              {t('2. Open the Ethereum app.')}
            </Text>
          </View>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignSelfCenter,
              flexbox.alignCenter,
              minHeightSize(620) ? spacings.mbLg : spacings.mb2Xl
            ]}
          >
            <DriveIcon style={spacings.mrLg} />
            <LeftPointerArrowIcon style={spacings.mrLg} color={theme.iconPrimary} />
            <AmbireDevice />
          </View>
          <Text style={[spacings.mbLg, text.center]} appearance="secondaryText">
            {t(
              'If not previously granted, Ambire will ask for permission to connect to a HID device.'
            )}
          </Text>

          <Button
            text={isLoading ? t('Connecting...') : t('Authorize & connect')}
            disabled={isLoading}
            style={{ width: 264, ...flexbox.alignSelfCenter }}
            onPress={onPressNext}
            hasBottomSpacing={false}
          />
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(LedgerConnectScreen)
