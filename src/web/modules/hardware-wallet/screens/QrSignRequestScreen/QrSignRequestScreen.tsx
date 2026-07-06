import React, { useMemo } from 'react'
import { View } from 'react-native'

import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import SigningRequestDetails from '@common/modules/hardware-wallets/components/SigningRequestDetails'
import spacings, { SPACING_LG } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
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
const QR_QUIET_ZONE = SPACING_LG
const BASE_QR_SIZE = 300
const BASE_QR_SIZE_WITH_PROGRESS = 280

const QrSignRequestScreen = ({
  onContinue,
  onReject,
  urType,
  urCborHex,
  transactionProgress = null,
  signingRequest = null
}: Props) => {
  const { t } = useTranslation()
  const { themeType } = useTheme()
  const isDarkMode = themeType === THEME_TYPES.DARK
  const baseQrSize = transactionProgress ? BASE_QR_SIZE_WITH_PROGRESS : BASE_QR_SIZE
  const qrSize = useMemo(
    () => (isDarkMode ? baseQrSize - QR_QUIET_ZONE * 2 : baseQrSize),
    [baseQrSize, isDarkMode]
  )

  const qrCode = useMemo(
    () => (
      <AnimatedQRCode
        options={{ size: qrSize, interval: ANIMATION_INTERVAL }}
        type={urType}
        cbor={urCborHex}
      />
    ),
    [qrSize, urType, urCborHex]
  )

  return (
    <View style={[flexbox.center, { width: '100%', flexGrow: 1, flexShrink: 0 }]}>
      <Text>{t('Scan this QR code with your QR-based device to sign.')}</Text>
      <View style={[flexbox.center, flexbox.flex1, spacings.mtSm, { width: '100%' }]}>
        {isDarkMode ? (
          <View
            style={[
              spacings.phLg,
              spacings.pvLg,
              common.borderRadiusPrimary,
              { backgroundColor: '#fff' }
            ]}
          >
            {qrCode}
          </View>
        ) : (
          qrCode
        )}
        {transactionProgress ? (
          <Text fontSize={14} weight="medium" style={spacings.mtSm}>
            {transactionProgress.current} / {transactionProgress.total}{' '}
            {transactionProgress.current <= 1 ? t('transaction signed') : t('transactions signed')}
          </Text>
        ) : null}
        {!!signingRequest && (
          <SigningRequestDetails
            signingRequest={signingRequest}
            style={[
              transactionProgress ? spacings.mtSm : spacings.mt,
              {
                width: 420
              }
            ]}
          />
        )}
        <FooterGlassView size="sm" absolute={false} style={{ ...spacings.ptSm, marginTop: 'auto' }}>
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
      </View>
    </View>
  )
}

export default React.memo(QrSignRequestScreen)
