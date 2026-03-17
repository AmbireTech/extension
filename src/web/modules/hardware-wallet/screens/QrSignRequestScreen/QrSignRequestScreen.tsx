import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  frames: string[]
}

const FRAME_INTERVAL = 300

const QrSignRequestScreen = ({ frames, onContinue }: Props & { onContinue: () => void }) => {
  const { t } = useTranslation()
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    if (!frames.length) return

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length)
    }, FRAME_INTERVAL)

    return () => clearInterval(interval)
  }, [frames])

  return (
    <Panel type="onboarding" title={t('Scan with your hardware wallet')}>
      <Text style={spacings.mbTy}>
        {t('Scan this QR code with your Keystone device to sign the message.')}
      </Text>
      <View style={[flexbox.center, spacings.mtSm]}>
        <QRCode
          key={frames[frameIndex]}
          value={frames[frameIndex]}
          size={320}
          backgroundColor="white"
          color="black"
        />
        <Button style={spacings.mtTy} text={t('I have scanned the QR code')} onPress={onContinue} />
      </View>
    </Panel>
  )
}

export default React.memo(QrSignRequestScreen)
