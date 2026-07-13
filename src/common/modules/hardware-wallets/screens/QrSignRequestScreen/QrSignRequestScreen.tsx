import React from 'react'
import { View } from 'react-native'

import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import AnimatedQrCode from '@common/modules/hardware-wallets/components/AnimatedQrCode'
import SigningRequestDetails from '@common/modules/hardware-wallets/components/SigningRequestDetails'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

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
  // A smaller code leaves room for the details + footer inside the mobile
  // bottom sheet; the desktop panel has space for the larger code.
  const qrSize = isMobile ? 260 : transactionProgress ? 280 : 300

  return (
    // Top-aligned (not vertically centered): when the content is taller than the
    // sheet, centering would overflow symmetrically and bleed the QR over the title.
    <View style={[flexbox.alignCenter, { width: '100%', flexGrow: 1, flexShrink: 0 }]}>
      <Text style={[spacings.mbSm, { textAlign: 'center' }]}>
        {t('Scan this QR code with your QR-based device to sign.')}
      </Text>
      <View style={[flexbox.alignCenter, flexbox.flex1, { width: '100%' }]}>
        <AnimatedQrCode
          size={qrSize}
          interval={ANIMATION_INTERVAL}
          type={urType}
          cbor={urCborHex}
        />
        {transactionProgress ? (
          <Text fontSize={14} weight="medium" style={spacings.mtSm}>
            {transactionProgress.current} / {transactionProgress.total}{' '}
            {transactionProgress.current <= 1 ? t('transaction signed') : t('transactions signed')}
          </Text>
        ) : null}
        {!!signingRequest && (
          <SigningRequestDetails
            signingRequest={signingRequest}
            style={isMobile ? [spacings.mtSm, { width: '100%' }] : [spacings.mt, { width: 420 }]}
          />
        )}
        <FooterGlassView
          size="sm"
          absolute={false}
          style={{ ...spacings.ptSm, marginTop: 'auto' }}
          mobileStyle={spacings.ptLg}
        >
          <Button
            size={isMobile ? 'regular' : 'smaller'}
            hasBottomSpacing={false}
            type="secondary"
            text={t('Back')}
            onPress={onReject}
            style={isWeb ? { width: 98, ...spacings.mrLg } : undefined}
          />
          <Button
            size={isMobile ? 'regular' : 'smaller'}
            hasBottomSpacing={isMobile}
            text={t('Get signature')}
            onPress={onContinue}
          />
        </FooterGlassView>
      </View>
    </View>
  )
}

export default React.memo(QrSignRequestScreen)
