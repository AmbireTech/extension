import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import QrScanner from '../QrConnectScreen/QrScanner'

type Props = {
  onSignatureScanned: (payload: Uint8Array) => void
  onBack: () => void
}

const QrSignResponseScanner = ({ onSignatureScanned, onBack }: Props) => {
  const { t } = useTranslation()
  const { addToast } = useToast()

  return (
    <View style={flexbox.center}>
      <Text style={spacings.mbTy}>
        {t('Scan the QR code displayed on your QR-based wallet to complete the signature.')}
      </Text>
      <View style={[flexbox.center, spacings.mtSm, { maxWidth: 300 }]}>
        <QrScanner
          onComplete={onSignatureScanned}
          onError={(msg: string) => addToast(msg, { type: 'error' })}
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
