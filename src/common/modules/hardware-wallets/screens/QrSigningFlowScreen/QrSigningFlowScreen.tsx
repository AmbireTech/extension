import React, { useCallback, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { QrRequest } from '@ambire-common/interfaces/keystore'
import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { QrSigningStep } from '@common/modules/hardware-wallets/qr/types'
import QrSignRequestScreen from '@common/modules/hardware-wallets/screens/QrSignRequestScreen'
import QrSignResponseScanner from '@common/modules/hardware-wallets/screens/QrSignResponseScanner'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

const { isTab } = getUiType()

type Props = {
  isVisible: boolean
  handleClose?: () => void
  currentRequest: QrRequest | null
  signingStep: QrSigningStep
  signingRequest?: HardwareWalletSigningRequest | null
  transactionProgress?: {
    current: number
    total: number
  } | null
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
  signingRequest = null,
  transactionProgress = null,
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
      adjustToContentHeight={isMobile}
      modalHeight={isWeb ? 585 : undefined}
      onClosed={handleClose}
      autoOpen={isVisible}
      type={!isTab ? 'bottom-sheet' : 'modal'}
      withBackdropBlur={false}
      shouldBeClosableOnDrag={false}
      containerInnerWrapperStyles={isWeb ? flexbox.flex1 : undefined}
      scrollViewProps={
        isWeb
          ? {
              contentContainerStyle: flexbox.flex1
            }
          : undefined
      }
    >
      <ModalHeader title={title} />

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
          <FooterGlassView size="sm" absolute={false} style={spacings.pt}>
            <Button
              text={t('Close')}
              onPress={() => close()}
              size="smaller"
              hasBottomSpacing={false}
              type="secondary"
            />
          </FooterGlassView>
        </View>
      ) : step === 'show-request' ? (
        <QrSignRequestScreen
          urType={request.urType}
          urCborHex={request.urCborHex}
          onContinue={onContinue}
          onReject={handleOnRejectPressed}
          transactionProgress={transactionProgress}
          signingRequest={signingRequest}
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
