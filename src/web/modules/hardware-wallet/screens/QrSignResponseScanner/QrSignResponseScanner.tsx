import React from 'react'
import { View } from 'react-native'

import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'

import QrScanner from '../QrConnectScreen/QrScanner'

type Props = {
  onSignatureScanned: (payload: Uint8Array) => void
}

const QrSignResponseScanner = ({ onSignatureScanned }: Props) => {
  const { t } = useTranslation()
  const { addToast } = useToast()

  return (
    <Panel type="onboarding" title={t('Scan signature')}>
      <Text style={spacings.mbSm}>
        {t('Scan the QR code displayed on your hardware wallet to complete the signature.')}
      </Text>

      <View style={spacings.mtSm}>
        <QrScanner
          onComplete={onSignatureScanned}
          onError={(msg: string) => addToast(msg, { type: 'error' })}
        />
      </View>
    </Panel>
  )
}

export default React.memo(QrSignResponseScanner)
