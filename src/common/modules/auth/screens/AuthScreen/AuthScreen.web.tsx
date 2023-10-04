import React, { useCallback } from 'react'
import { View } from 'react-native'

import Button, { Props as ButtonDefaultProps } from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import AmbireLogo from '@common/modules/auth/components/AmbireLogo'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import textStyles from '@common/styles/utils/text'

interface ButtonProps extends Omit<ButtonDefaultProps, 'onPress'> {
  routeName: keyof typeof WEB_ROUTES
  onPress: (nextRoute: keyof typeof WEB_ROUTES) => void
}

const AuthButton = React.memo(
  ({ text, type = 'primary', routeName, onPress, disabled }: ButtonProps) => {
    const handleButtonPress = useCallback(() => {
      !!onPress && onPress(routeName)
    }, [onPress, routeName])

    return <Button text={text} type={type} disabled={disabled} onPress={handleButtonPress} />
  }
)

const AuthScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const handleAuthButtonPress = useCallback((nextRoute: ROUTES) => navigate(nextRoute), [navigate])

  return (
    <GradientBackgroundWrapper>
      <Wrapper>
        <AmbireLogo />
        <View>
          <AuthButton
            text={t('Login With Email')}
            routeName={WEB_ROUTES.ambireAccountLogin}
            onPress={handleAuthButtonPress}
            hasBottomSpacing={false}
          />
          <AuthButton
            text={t('Hardware Wallet')}
            routeName={WEB_ROUTES.hardwareWalletSelect}
            onPress={handleAuthButtonPress}
            style={spacings.mbLg}
          />
          <Text style={[textStyles.center, spacings.mb]} weight="regular" fontSize={18}>
            {t('– or –')}
          </Text>
          <AuthButton
            text={t('Import From JSON')}
            type="outline"
            routeName={WEB_ROUTES.ambireAccountJsonLogin}
            onPress={handleAuthButtonPress}
          />
          <AuthButton
            text={t('Login with External Signer')}
            type="outline"
            routeName={WEB_ROUTES.externalSigner}
            onPress={handleAuthButtonPress}
          />
        </View>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default React.memo(AuthScreen)
