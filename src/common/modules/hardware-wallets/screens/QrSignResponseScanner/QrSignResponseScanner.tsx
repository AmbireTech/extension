import React, { useCallback } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import QrScannerWithPermission from '@common/modules/hardware-wallets/screens/QrScannerWithPermission'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

type Props = {
  onSignatureScanned: (payload: Uint8Array) => void
}

const SCANNER_SIZE = 280

const QrSignResponseScanner = ({ onSignatureScanned }: Props) => {
  const { isCompactLayout: withMobileLayout } = useCompactLayout()
  const { t } = useTranslation()

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
      <View
        style={
          withMobileLayout
            ? {
                width: SCANNER_SIZE + 4,
                height: SCANNER_SIZE + 4,
                borderRadius: BORDER_RADIUS_PRIMARY + 6,
                overflow: 'hidden'
              }
            : [flexbox.center, { width: '100%', maxWidth: 300 }]
        }
      >
        <QrScannerWithPermission
          onComplete={onSignatureScanned}
          onOpenFullScreenScanner={handleOpenOnFullScreenScanner}
        />
      </View>
    </View>
  )
}

export default React.memo(QrSignResponseScanner)
