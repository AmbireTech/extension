import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AmbireDevice from '@common/assets/svg/AmbireDevice'
import DriveIcon from '@common/assets/svg/DriveIcon'
import LeftPointerArrowIcon from '@common/assets/svg/LeftPointerArrowIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { Trans, useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { openInternalPageInTab } from '@web/extension-services/background/webapi/tab'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useLedger from '@web/modules/hardware-wallet/hooks/useLedger'
import { getUiType } from '@web/utils/uiType'

type Props = {
  isVisible: boolean
  handleClose?: () => void
  handleOnConnect?: () => void
  /**
   * The WebHID API allows the authorization to happen only in the extension
   * foreground and on a new tab (not in an action window).
   */
  displayOptionToAuthorize?: boolean
}

const { isTab } = getUiType()

const LedgerConnectModal = ({
  isVisible,
  handleClose = () => {},
  handleOnConnect,
  displayOptionToAuthorize = true
}: Props) => {
  const { ref, open, close } = useModalize()
  const mainCtrlState = useMainControllerState()
  const { requestLedgerDeviceAccess } = useLedger()
  const { addToast } = useToast()
  const { t } = useTranslation()
  const [isGrantingPermission, setIsGrantingPermission] = useState(false)
  const { currentAction, actionWindow } = useActionsControllerState()
  const { theme, themeType } = useTheme()

  useEffect(() => {
    if (isVisible) open()
    else close()
  }, [open, close, isVisible])

  const onPressNext = async () => {
    try {
      // Request Ledger access first, before any state updates to prevent error:
      // "Failed to execute 'requestDevice' on 'HID': Must be handling a user
      // gesture to show a permission request." on some browsers like Vivaldi.
      await requestLedgerDeviceAccess()

      setIsGrantingPermission(true)

      if (handleOnConnect) handleOnConnect()
    } catch (error: any) {
      addToast(error.message, { type: 'error' })
    } finally {
      // Clear the flag to allow the user to try again. For all other cases,
      // the state gets reset automatically, because the on connect success
      // the flow redirects the user to another route (and this component unmounts).
      setIsGrantingPermission(false)
    }
  }

  const handleOnLedgerReauthorize = useCallback(
    () =>
      openInternalPageInTab({
        route: `${WEB_ROUTES.ledgerConnect}?actionId=${currentAction?.id}`,
        // Don't close the action window if the current action is a sign message
        // as that would reject the message automatically.
        shouldCloseCurrentWindow: currentAction?.type === 'accountOp',
        windowId: actionWindow.windowProps?.createdFromWindowId
      }),
    [currentAction?.id, currentAction?.type, actionWindow.windowProps?.createdFromWindowId]
  )

  const isLoading =
    isGrantingPermission || mainCtrlState.statuses.handleAccountPickerInitLedger === 'LOADING'

  return (
    <BottomSheet
      id="ledger-connect-modal"
      sheetRef={ref}
      backgroundColor={themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'}
      autoWidth={false}
      closeBottomSheet={handleClose}
      onClosed={handleClose}
      autoOpen={isVisible}
      // The modal is displayed in tab in swap and bridge
      type={!isTab ? 'bottom-sheet' : 'modal'}
      containerInnerWrapperStyles={isTab ? { ...spacings.pv2Xl, ...spacings.ph2Xl } : {}}
      withBackdropBlur={false}
    >
      <ModalHeader title={t('Connect Ledger')} />
      <View style={[flexbox.alignSelfCenter, spacings.mbSm]}>
        <Text weight="regular" style={spacings.mbTy} fontSize={14}>
          {t('1. Plug in your Ledger via cable and enter a PIN to unlock it.')}
        </Text>
        <Text weight="regular" fontSize={14} style={{ marginBottom: 40 }}>
          {t('2. Open the Ethereum app.')}
        </Text>
      </View>
      <View
        style={[flexbox.directionRow, flexbox.alignSelfCenter, flexbox.alignCenter, spacings.mb3Xl]}
      >
        <DriveIcon style={spacings.mrLg} />
        <LeftPointerArrowIcon style={spacings.mrLg} />
        <AmbireDevice />
      </View>
      <Text weight="regular" style={[spacings.mbLg, text.center]} fontSize={14}>
        {displayOptionToAuthorize ? (
          t('If not previously granted, Ambire will ask for permission to connect to a HID device.')
        ) : (
          <Trans>
            <Text weight="regular" fontSize={14}>
              If it still doesn&apos;t work after completing these steps,{' '}
            </Text>
            <Text
              weight="semiBold"
              fontSize={14}
              underline
              color={theme.primary}
              onPress={handleOnLedgerReauthorize}
            >
              try re-authorizing Ambire to connect
            </Text>
            <Text weight="regular" fontSize={14}>
              .
            </Text>
          </Trans>
        )}
      </Text>
      {displayOptionToAuthorize && (
        <Button
          text={isLoading ? t('Connecting...') : t('Authorize & Connect')}
          disabled={isLoading}
          style={{ width: 264, ...flexbox.alignSelfCenter }}
          onPress={onPressNext}
        />
      )}
    </BottomSheet>
  )
}

export default LedgerConnectModal
