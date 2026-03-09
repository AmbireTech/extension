import React, { useEffect, useState } from 'react'

import LedgerLetterIconFilled from '@common/assets/svg/LedgerLetterIconFilled'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { isLedgerEmulator } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings from '@common/styles/spacings'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import useLedger from '@web/modules/hardware-wallet/hooks/useLedger'

export const CARD_WIDTH = 400

const LedgerConnectScreen = () => {
  const mainCtrlState = useController('MainController').state
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { requestLedgerDeviceAccess } = useLedger()
  const { addToast } = useToast()
  const { t } = useTranslation()
  const [isGrantingPermission, setIsGrantingPermission] = useState(false)
  const { theme } = useTheme()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { dispatch } = useControllersMiddleware()
  const { initParams, type } = useController('AccountPickerController').state
  const [authorizeButtonPressed, setAuthorizeButtonPressed] = useState(false)
  const route = useRoute()

  const onPressNext = async () => {
    try {
      if (!isLedgerEmulator) {
        // Request Ledger access first, before any state updates to prevent error:
        // "Failed to execute 'requestDevice' on 'HID': Must be handling a user
        // gesture to show a permission request." on Vivaldi browser.
        await requestLedgerDeviceAccess()
      }

      setIsGrantingPermission(true)
      setAuthorizeButtonPressed(true)

      const params = new URLSearchParams(route?.search)
      const requestId = params.get('requestId')
      if (requestId) {
        requestsDispatch({
          type: 'method',
          params: {
            method: 'setCurrentUserRequestById',
            args: [requestId]
          }
        })
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
    // In Emulator mode, automatically proceed with the connection flow without
    // requiring a USB/HID permission gesture.
    if (isLedgerEmulator && !authorizeButtonPressed && !isGrantingPermission) {
      // Fire and forget; errors will be surfaced via toast from onPressNext
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      onPressNext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorizeButtonPressed, isGrantingPermission])

  useEffect(() => {
    if (!isLedgerEmulator && !!authorizeButtonPressed && initParams && type === 'ledger') {
      setAuthorizeButtonPressed(false)
      goToNextRoute()
    }
  }, [authorizeButtonPressed, goToNextRoute, dispatch, initParams, type])

  useEffect(() => {
    // In Emulator mode, once the Ledger account picker init succeeds, move to the next screen
    if (isLedgerEmulator && mainCtrlState.statuses.handleAccountPickerInitLedger === 'SUCCESS') {
      goToNextRoute()
    }
  }, [goToNextRoute, mainCtrlState.statuses.handleAccountPickerInitLedger])

  const isLoading =
    isGrantingPermission || mainCtrlState.statuses.handleAccountPickerInitLedger === 'LOADING'

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent>
        <Panel
          spacingsSize="small"
          type="onboarding"
          withBackButton
          onBackButtonPress={goToPrevRoute}
          title={t('Connect Ledger')}
        >
          <LedgerLetterIconFilled
            style={{ alignSelf: 'center', marginBottom: 124 }}
            width={96}
            height={96}
          />
          <Text weight="medium" style={spacings.mbSm} fontSize={14}>
            {isLedgerEmulator
              ? t('1. Make sure your Ledger emulator is running.')
              : t('1. Plug in your Ledger and enter a PIN to unlock it.')}
          </Text>
          <Text weight="medium" fontSize={14} style={spacings.mbXl}>
            {t('2. Open the Ethereum app.')}
          </Text>
          <Text style={spacings.mbXl} fontSize={14} appearance="secondaryText">
            {isLedgerEmulator
              ? t('Connecting to the Ledger emulator configured for this environment.')
              : t(
                  'If not previously granted, Ambire will ask for permission to connect to a HID device.'
                )}
          </Text>
          {!isLedgerEmulator && (
            <Button
              text={isLoading ? t('Connecting...') : t('Authorize & connect')}
              disabled={isLoading}
              onPress={onPressNext}
              hasBottomSpacing={false}
            />
          )}
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(LedgerConnectScreen)
