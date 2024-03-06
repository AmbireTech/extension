import React, { useEffect } from 'react'
import { View } from 'react-native'

import AmbireDevice from '@common/assets/svg/AmbireDevice'
import DriveIcon from '@common/assets/svg/DriveIcon'
import LeftPointerArrowIcon from '@common/assets/svg/LeftPointerArrowIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useStepper from '@common/modules/auth/hooks/useStepper'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'

import LedgerController from '../../controllers/LedgerController'

type Props = {
  modalRef: any
  handleClose: () => void
}

const LedgerConnectModal = ({ modalRef, handleClose }: Props) => {
  const { updateStepperState } = useStepper()
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    updateStepperState('connect-hardware-wallet', 'hw')
  }, [updateStepperState])

  const onPressNext = async () => {
    // The WebHID API requires a user gesture to open the device selection prompt
    // where users grant permission to the extension to access an HID device.
    // Therefore, force unlocking the Ledger device here.
    try {
      const ledgerCtrl = await new LedgerController()
      await ledgerCtrl.unlock()
      await ledgerCtrl.cleanUp()
    } catch (error: any) {
      console.error(error)
      // Fail silently. The error handling feedback for the user comes from the
      // controller instance in the background process.
    }

    dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_LEDGER' })
  }

  return (
    <BottomSheet
      id="ledger-connect-modal"
      sheetRef={modalRef}
      closeBottomSheet={handleClose}
      backgroundColor="primaryBackground"
      autoWidth={false}
    >
      <ModalHeader title={t('Connect your HW wallet')} />
      <View style={[flexbox.alignSelfCenter, spacings.mbSm]}>
        <Text weight="regular" style={spacings.mbTy} fontSize={14}>
          {t('1. Plug your Ledger device into your computer')}
        </Text>
        <Text weight="regular" fontSize={14} style={{ marginBottom: 40 }}>
          {t('2. Unlock your Ledger and open the Ethereum app')}
        </Text>
      </View>
      <View
        style={[flexbox.directionRow, flexbox.alignSelfCenter, flexbox.alignCenter, spacings.mb3Xl]}
      >
        <DriveIcon style={spacings.mrLg} />
        <LeftPointerArrowIcon style={spacings.mrLg} />
        <AmbireDevice />
      </View>
      <Button
        text={t('Next')}
        style={{ width: 264, ...flexbox.alignSelfCenter }}
        onPress={onPressNext}
      />
    </BottomSheet>
  )
}

export default LedgerConnectModal
