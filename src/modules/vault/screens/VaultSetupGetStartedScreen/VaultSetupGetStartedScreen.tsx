import React from 'react'
import { View } from 'react-native'

import { isWeb } from '@config/env'
import { useTranslation } from '@config/localization'
import AmbireLogo from '@modules/auth/components/AmbireLogo'
import Button from '@modules/common/components/Button'
import GradientBackgroundWrapper from '@modules/common/components/GradientBackgroundWrapper'
import Text from '@modules/common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@modules/common/components/Wrapper'
import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'

const VaultSetupGetStartedScreen = ({ navigation }: any) => {
  const { t } = useTranslation()

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
              {t('Welcome to the Ambire Wallet extension. Let’s set up your Key Store passphrase.')}
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
                '3.  You will use your passphrase to unlock the Ambire extension and sign transactions on this device.'
              )}
            </Text>
          </View>

          <Button
            style={spacings.mt}
            text={t('Get Started')}
            onPress={() => navigation.navigate('createVault')}
          />
        </View>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default VaultSetupGetStartedScreen
