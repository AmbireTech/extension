import React, { useCallback, useState } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import QrScannerWithPermission from '@common/modules/hardware-wallets/screens/QrScannerWithPermission'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

type Props = {
  onSignatureScanned: (payload: Uint8Array) => void
  onBack: () => void
}

const QrSignResponseScanner = ({ onSignatureScanned, onBack }: Props) => {
  const { t } = useTranslation()
  // On mobile the step change is async (bridge round-trip), so this screen stays
  // mounted while the sheet transitions. The native camera surface then desyncs
  // from the RN overlay and the scan-frame corners jump around. Tear the camera
  // down synchronously on Back so nothing native is animating during the change.
  const [isCameraTornDown, setIsCameraTornDown] = useState(false)

  const handleBack = useCallback(() => {
    setIsCameraTornDown(true)
    onBack()
  }, [onBack])

  const handleOpenOnFullScreenScanner = useCallback(
    async () =>
      await openInTab({
        url: `tab.html#/${WEB_ROUTES.qrPermission}`
      }),
    []
  )

  return (
    <View style={[flexbox.flex1, flexbox.alignCenter, { width: '100%' }]}>
      <Text style={[spacings.mbSm, { textAlign: 'center' }]}>
        {t('Scan the QR code displayed on your QR-based wallet to complete the signature.')}
      </Text>
      {/* On mobile the native camera fills its parent, so the box needs an explicit
          size; on web the scanner self-sizes (its <video/> sets the height). */}
      <View
        style={
          isMobile
            ? { width: 260, height: 260, borderRadius: BORDER_RADIUS_PRIMARY, overflow: 'hidden' }
            : [flexbox.center, { width: '100%', maxWidth: 300 }]
        }
      >
        {!isCameraTornDown && (
          <QrScannerWithPermission
            onComplete={onSignatureScanned}
            onOpenFullScreenScanner={handleOpenOnFullScreenScanner}
          />
        )}
      </View>
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
          onPress={handleBack}
          style={isWeb ? { width: 98 } : undefined}
        />
      </FooterGlassView>
    </View>
  )
}

export default React.memo(QrSignResponseScanner)
