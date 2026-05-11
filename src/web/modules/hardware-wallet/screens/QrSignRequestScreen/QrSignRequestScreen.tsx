import React from 'react'
import { View } from 'react-native'

import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import SigningRequestDetails from '@common/modules/hardware-wallets/components/SigningRequestDetails'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedQRCode } from '@keystonehq/animated-qr'

type Props = {
  onContinue: () => void
  onReject: () => void
  urType: any
  urCborHex: any
  transactionProgress?: {
    current: number
    total: number
  } | null
  signingRequest?: HardwareWalletSigningRequest | null
}

const ANIMATION_INTERVAL = 300

const QrSignRequestScreen = ({
  onContinue,
  onReject,
  urType,
  urCborHex,
  transactionProgress = null,
  signingRequest = null
}: Props) => {
  const { t } = useTranslation()
  const qrSize = transactionProgress ? 280 : 300

  return (
    <View style={[flexbox.center, { width: '100%' }]}>
      <Text>{t('Scan this QR code with your QR-based device to sign.')}</Text>
      <View style={[flexbox.center, spacings.mtSm, { width: '100%' }]}>
        <AnimatedQRCode
          options={{ size: qrSize, interval: ANIMATION_INTERVAL }}
          type={urType}
          cbor={urCborHex}
        />
        {transactionProgress ? (
          <Text fontSize={14} weight="medium" style={spacings.mtSm}>
            {transactionProgress.current} / {transactionProgress.total}{' '}
            {transactionProgress.current <= 1 ? t('transaction signed') : t('transactions signed')}
          </Text>
        ) : null}
        <FooterGlassView size="sm" absolute={false} style={spacings.ptSm}>
          <Button
            size="smaller"
            hasBottomSpacing={false}
            type="secondary"
            text={t('Back')}
            onPress={onReject}
            style={{ width: 98, ...spacings.mrLg }}
          />
          <Button
            size="smaller"
            hasBottomSpacing={false}
            text={t('Get signature')}
            onPress={onContinue}
          />
        </FooterGlassView>
        {!!signingRequest && (
          <SigningRequestDetails
            signingRequest={signingRequest}
            style={[
              spacings.mt,
              {
                width: '100%',
                maxWidth: 420
              }
            ]}
          />
        )}
      </View>
    </View>
  )
}

export default React.memo(QrSignRequestScreen)
