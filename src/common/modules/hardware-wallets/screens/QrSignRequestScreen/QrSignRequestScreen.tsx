import React, { useMemo } from 'react'
import { useWindowDimensions, View } from 'react-native'

import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import AnimatedQrCode from '@common/modules/hardware-wallets/components/AnimatedQrCode'
import SigningRequestDetails from '@common/modules/hardware-wallets/components/SigningRequestDetails'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

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

// Matches what the QR wallets themselves animate at (the Keycard Shell firmware uses
// 200ms), so the pace is one their cameras are known to keep up with
const ANIMATION_INTERVAL = 200
const BASE_QR_SIZE = 300
const BASE_QR_SIZE_WITH_PROGRESS = 280
const SIDE_PANEL_QR_SIZE = 284
const MAX_MOBILE_QR_SIZE = 400

const { isSidePanel } = getUiType()
const withMobileLayout = isMobile || isSidePanel

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
  const { width: windowWidth } = useWindowDimensions()
  // Same sizing as the accounts sync export sheet: stretch the code to the full width
  // available inside the sheet (padded by SPACING_SM on both sides), but cap it on
  // larger devices so it stays centered. The desktop panel has a fixed larger code.
  const qrSize = isMobile
    ? Math.min(windowWidth - SPACING_SM * 2, MAX_MOBILE_QR_SIZE)
    : isSidePanel
      ? SIDE_PANEL_QR_SIZE
      : transactionProgress
        ? BASE_QR_SIZE_WITH_PROGRESS
        : BASE_QR_SIZE

  // The sheet background is already white on the light theme, so the QR's own white
  // quiet zone is invisible there - drop it and let the code fill that space instead.
  const qrQuietZone = isMobile && themeType === THEME_TYPES.LIGHT ? 0 : undefined

  const qrCode = useMemo(
    () => (
      <AnimatedQrCode
        size={qrSize}
        interval={ANIMATION_INTERVAL}
        type={urType}
        cbor={urCborHex}
        quietZone={qrQuietZone}
      />
    ),
    [qrSize, urType, urCborHex, qrQuietZone]
  )

  return (
    // Top-aligned (not vertically centered): when the content is taller than the
    // sheet, centering would overflow symmetrically and bleed the QR over the title.
    <View style={[flexbox.alignCenter, { width: '100%', flexGrow: 1, flexShrink: 0 }]}>
      <Text style={[spacings.mbSm, { textAlign: 'center' }]}>
        {t('Scan this QR code with your QR-based device to sign.')}
      </Text>
      <View style={[flexbox.alignCenter, flexbox.flex1, { width: '100%' }]}>
        {qrCode}
        {transactionProgress ? (
          <Text fontSize={14} weight="medium" style={spacings.mtSm}>
            {transactionProgress.current} / {transactionProgress.total}{' '}
            {transactionProgress.current <= 1 ? t('transaction signed') : t('transactions signed')}
          </Text>
        ) : null}
        {!!signingRequest && (
          <SigningRequestDetails
            signingRequest={signingRequest}
            style={
              withMobileLayout
                ? [spacings.mtSm, { width: '100%' }]
                : [transactionProgress ? spacings.mtSm : spacings.mt, { width: 420 }]
            }
          />
        )}
        {/* Inside a bottom sheet the buttons are rendered as its sticky footer, so they
        stay reachable no matter how tall the signing request details get */}
        {!withMobileLayout && (
          <FooterGlassView
            size="sm"
            absolute={false}
            style={{ ...spacings.ptSm, marginTop: 'auto' }}
          >
            <Button
              size="smaller"
              hasBottomSpacing={false}
              type="secondary"
              text={t('Back')}
              onPress={onReject}
              style={isWeb ? { width: 98, ...spacings.mrLg } : undefined}
            />
            <Button
              size="smaller"
              hasBottomSpacing={false}
              text={t('Get signature')}
              onPress={onContinue}
            />
          </FooterGlassView>
        )}
      </View>
    </View>
  )
}

export default React.memo(QrSignRequestScreen)
