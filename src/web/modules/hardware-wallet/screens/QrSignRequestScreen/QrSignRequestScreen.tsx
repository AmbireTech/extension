import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Panel, { PanelProps } from '@common/components/Panel'
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
  panelType?: PanelProps['type']
}

const FRAME_INTERVAL = 300

const QrSignRequestScreen = ({
  onContinue,
  onReject,
  urType,
  urCborHex,
  panelType = 'default'
}: Props) => {
  const { t } = useTranslation()

  return (
    <Panel type={panelType} title={t('Scan with your hardware wallet')} withBackButton={false}>
      <Text style={spacings.mbTy}>
        {t('Scan this QR code with your Keystone device to sign the message.')}
      </Text>
      <View style={[flexbox.center, spacings.mtSm]}>
        <AnimatedQRCode options={{ size: 300 }} type={urType} cbor={urCborHex} />
        {/* TODO: Fix the styles */}
        <Button style={spacings.mtTy} text={t('I have scanned the QR code')} onPress={onContinue} />
        <Button text={t('Reject')} onPress={onReject} />
      </View>
    </Panel>
  )
}

export default React.memo(QrSignRequestScreen)
