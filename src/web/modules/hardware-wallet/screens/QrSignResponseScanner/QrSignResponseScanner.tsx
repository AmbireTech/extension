import React, { useCallback } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import QrScannerWithPermission from '@web/modules/hardware-wallet/screens/QrScannerWithPermission'

type Props = {
  onSignatureScanned: (payload: Uint8Array) => void
  onBack: () => void
}

const QrSignResponseScanner = ({ onSignatureScanned, onBack }: Props) => {
  const { t } = useTranslation()

  const handleOpenOnFullScreenScanner = useCallback(
    async () =>
      await openInTab({
        url: `tab.html#/${WEB_ROUTES.qrPermission}`
      }),
    []
  )

  return (
    <View style={flexbox.center}>
      <Text style={spacings.mbTy}>
        {t('Scan the QR code displayed on your QR-based wallet to complete the signature.')}
      </Text>
      <View style={[flexbox.center, spacings.mtSm, { maxWidth: 300 }]}>
        <QrScannerWithPermission
          onComplete={onSignatureScanned}
          onOpenFullScreenScanner={handleOpenOnFullScreenScanner}
        />
        <FooterGlassView size="sm" absolute={false} style={spacings.pt}>
          <Button
            size="smaller"
            hasBottomSpacing={false}
            type="secondary"
            text={t('Back')}
            onPress={onBack}
            style={{ width: 98 }}
          />
        </FooterGlassView>
      </View>
    </View>
  )
}

export default React.memo(QrSignResponseScanner)
