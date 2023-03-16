import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Text from '@common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import AmbireLogo from '@common/modules/auth/components/AmbireLogo'
import { ROUTES } from '@common/modules/router/config/routesConfig'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

const VaultSetupGetStartedScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  return (
    <GradientBackgroundWrapper>
      <Wrapper
        contentContainerStyle={spacings.pbLg}
        type={WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW}
        extraHeight={220}
      >
        <AmbireLogo />
        <View style={[isWeb && spacings.ph, flexboxStyles.flex1, flexboxStyles.justifyEnd]}>
          <View style={[spacings.mbLg, spacings.phTy]}>
            <Text weight="light" style={spacings.mbTy} color={colors.titan} fontSize={13}>
              {t('Welcome to the {{name}}. Let’s set up your Key Store passphrase.', {
                name: isWeb ? t('Ambire Wallet extension') : t('Ambire Wallet')
              })}
            </Text>
            <Text weight="light" style={spacings.mbTy} color={colors.titan} fontSize={13}>
              {t(
                '1.  Ambire Key Store will protect your Ambire wallet with email password or external signer on this device.'
              )}
            </Text>
            <Text weight="light" style={spacings.mbTy} color={colors.titan} fontSize={13}>
              {t(
                '2.  First, pick your Ambire Key Store passphrase. It is unique for this device and it should be different from your account password.'
              )}
            </Text>
            <Text weight="light" color={colors.titan} fontSize={13}>
              {t(
                '3.  You will use your passphrase to unlock the {{name}} and sign transactions on this device.',
                { name: isWeb ? t('Ambire extension') : t('Ambire Wallet') }
              )}
            </Text>
          </View>

          <Button
            style={spacings.mt}
            text={t('Get Started')}
            onPress={() => navigate(ROUTES.createVault, { replace: true })}
          />
        </View>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default VaultSetupGetStartedScreen
