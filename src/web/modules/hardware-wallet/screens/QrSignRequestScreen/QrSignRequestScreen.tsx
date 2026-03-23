import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedQRCode } from '@keystonehq/animated-qr'

type Props = {
  onContinue: () => void
  onReject: () => void
  urType: string | undefined
  urCborHex: any
}

const FRAME_INTERVAL = 300

const QrSignRequestScreen = ({ onContinue, onReject, urType, urCborHex }: Props) => {
  const { t } = useTranslation()

  return (
    <View style={flexbox.center}>
      <Text style={spacings.mbTy}>{t('Scan this QR code with your QR-based device to sign.')}</Text>
      <View style={[flexbox.center, spacings.mtSm]}>
        <AnimatedQRCode options={{ size: 300 }} type={urType} cbor={urCborHex} />
        <FooterGlassView size="sm" absolute={false} style={spacings.pt}>
          <Button
            size="smaller"
            hasBottomSpacing={false}
            type="secondary"
            text={t('Back')}
            onPress={onReject}
            style={spacings.mrSm}
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
