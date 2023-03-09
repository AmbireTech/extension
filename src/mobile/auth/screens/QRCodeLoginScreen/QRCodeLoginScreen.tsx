import React from 'react'

import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import QRCodeScanner from '@common/components/QRCodeScanner'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import useQRCodeLogin from '@mobile/auth/hooks/useQRCodeLogin'

const QRCodeLoginScreen = () => {
  const { t } = useTranslation()
  const { handleLogin, error, inProgress, setError } = useQRCodeLogin()

  if (!error && !inProgress) {
    return (
      <GradientBackgroundWrapper>
        <QRCodeScanner onScan={handleLogin} />
      </GradientBackgroundWrapper>
    )
  }

  return (
    <GradientBackgroundWrapper>
      <Wrapper>
        {!!inProgress && <Text style={spacings.mbSm}>{t('Logging in...')}</Text>}
        {!!error && (
          <>
            <Text appearance="danger" style={spacings.mbSm}>
              {error}
            </Text>
            <Button text="Try again" onPress={() => setError('')} />
          </>
        )}
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default QRCodeLoginScreen
