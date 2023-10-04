import React from 'react'
import { View } from 'react-native'

import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useJsonLogin from '@common/modules/auth/hooks/useJsonLogin'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import styles from './styles'

const JsonLoginScreen = () => {
  const { t } = useTranslation()
  const { handleLogin, error, inProgress } = useJsonLogin()

  return (
    <GradientBackgroundWrapper>
      <Wrapper contentContainerStyle={spacings.pbLg}>
        <AmbireLogoHorizontal width={132} height={60} style={styles.horizontalLogo} />
        <Button
          disabled={inProgress}
          text={inProgress ? t('Importing...') : t('Select File')}
          onPress={() => handleLogin({})}
          hasBottomSpacing={!error || isWeb}
        />
        {!!error && (
          <View style={spacings.ptTy}>
            <Text appearance="danger" fontSize={12} style={spacings.ph}>
              {error}
            </Text>
          </View>
        )}
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default JsonLoginScreen
