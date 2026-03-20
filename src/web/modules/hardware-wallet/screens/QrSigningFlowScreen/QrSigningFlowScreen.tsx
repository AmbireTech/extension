import React, { useEffect, useMemo } from 'react'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
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
}

const QrSigningFlowScreen = ({
  isVisible,
  handleClose = () => {},
  currentRequest,
  signingStep,
  onContinue,
  submitSignatureResponse
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
        <Text>{t('ERROR')}</Text>
      ) : step === 'show-request' ? (
        <QrSignRequestScreen
          urType={request.urType}
          urCborHex={request.urCborHex}
          onContinue={onContinue}
        />
      ) : step === 'scan-response' ? (
        <QrSignResponseScanner onSignatureScanned={(payload) => submitSignatureResponse(payload)} />
      ) : null}
    </BottomSheet>
  )
}

export default React.memo(QrSigningFlowScreen)
