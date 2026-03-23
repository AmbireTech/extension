import React, { useCallback, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import { QrRequest, QrSigningStep } from '../../qr/types'
import QrSignRequestScreen from '../QrSignRequestScreen/QrSignRequestScreen'
import QrSignResponseScanner from '../QrSignResponseScanner/QrSignResponseScanner'

const { isTab } = getUiType()

type Props = {
  isVisible: boolean
  handleClose?: () => void
  currentRequest: QrRequest | null
  signingStep: QrSigningStep
  onContinue: () => void
  submitSignatureResponse: (payload: string | Uint8Array) => void
  onReject: () => void
  handleQrSigningFlowOnBackPressed: () => void
}

const QrSigningFlowScreen = ({
  isVisible,
  handleClose = () => {},
  currentRequest,
  signingStep,
  onContinue,
  submitSignatureResponse,
  onReject,
  handleQrSigningFlowOnBackPressed
}: Props) => {
  const { ref, open, close } = useModalize()
  const { t } = useTranslation()

  const request = useMemo(() => currentRequest, [currentRequest])
  const step = useMemo(() => signingStep, [signingStep])

  useEffect(() => {
    if (isVisible) open()
    else close()
  }, [open, close, isVisible])

  const title = step === 'scan-response' ? t('Scan QR response') : t('Sign with QR wallet')

  const handleOnRejectPressed = useCallback(() => {
    close()
    onReject()
  }, [close, onReject])

  return (
    <BottomSheet
      id="qr-signing-flow-screen"
      sheetRef={ref}
      autoWidth={false}
      closeBottomSheet={handleClose}
      onClosed={handleClose}
      autoOpen={isVisible}
      type={!isTab ? 'bottom-sheet' : 'modal'}
      containerInnerWrapperStyles={isTab ? { ...spacings.pv2Xl, ...spacings.ph2Xl } : {}}
      withBackdropBlur={false}
    >
      <ModalHeader title={title} handleClose={handleClose} />

      {!request ? (
        <View style={[flexbox.alignCenter, spacings.ptXl, spacings.pbLg]}>
          <Text weight="medium" fontSize={18} style={[flexbox.center, spacings.mbSm]}>
            {t('Unable to start QR signing')}
          </Text>
          <Text fontSize={12} appearance="secondaryText" style={[flexbox.center]}>
            {t('The QR signing request is missing or invalid.')}
          </Text>
          <Text fontSize={12} appearance="secondaryText" style={[flexbox.center, spacings.mbLg]}>
            {t('Please close this window and try again.')}
          </Text>
          <Button text={t('Close')} onPress={() => close()} style={{ minWidth: 160 }} />
        </View>
      ) : step === 'show-request' ? (
        <QrSignRequestScreen
          urType={request.urType}
          urCborHex={request.urCborHex}
          onContinue={onContinue}
          onReject={handleOnRejectPressed}
        />
      ) : step === 'scan-response' ? (
        <QrSignResponseScanner
          onSignatureScanned={(payload) => submitSignatureResponse(payload)}
          onBack={handleQrSigningFlowOnBackPressed}
        />
      ) : null}
    </BottomSheet>
  )
}

export default React.memo(QrSigningFlowScreen)
