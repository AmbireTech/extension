import React, { useEffect, useState } from 'react'
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
import useToast from '@common/hooks/useToast'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useMainControllerState from '@web/hooks/useMainControllerState'

import useLedger from '../../hooks/useLedger'

type Props = {
  isVisible: boolean
  handleClose?: () => void
  handleOnConnect: () => void
  /**
   * The WebHID API allows the authorization to happen only in the extension
   * foreground and on a new tab (not in an action window).
   */
  displayOptionToAuthorize?: boolean
}

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

  useEffect(() => {
    if (isVisible) open()
    else close()
  }, [open, close, isVisible])

  const onPressNext = async () => {
    setIsGrantingPermission(true)

    try {
      await requestLedgerDeviceAccess()

      handleOnConnect()
    } catch (error: any) {
      addToast(error.message, { type: 'error' })
    } finally {
      // Clear the flag to allow the user to try again. For all other cases,
      // the state gets reset automatically, because the on connect success
      // the flow redirects the user to another route (and this component unmounts).
      setIsGrantingPermission(false)
    }
  }

  const isLoading =
    isGrantingPermission || mainCtrlState.statuses.handleAccountAdderInitLedger === 'LOADING'

  return (
    <BottomSheet
      id="ledger-connect-modal"
      sheetRef={ref}
      backgroundColor="primaryBackground"
      autoWidth={false}
      closeBottomSheet={handleClose}
      onClosed={handleClose}
      autoOpen={isVisible}
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
            <Text weight="semiBold" fontSize={14} underline color={colors.heliotrope}>
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
