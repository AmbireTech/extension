import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import AppIntroSlider from 'react-native-app-intro-slider'

import FingerprintIcon from '@common/assets/svg/FingerprintIcon'
import KeyStoreIcon from '@common/assets/svg/KeyStoreIcon'
import PasswordIcon from '@common/assets/svg/PasswordIcon'
import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Text from '@common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import AmbireLogo from '@common/modules/auth/components/AmbireLogo'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings, { IS_SCREEN_SIZE_S } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import styles from './styles'

const VaultSetupGetStartedScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  const data = useMemo(() => {
    return [
      {
        icon: <KeyStoreIcon height={90} />,
        text: t(
          'Ambire Key Store will protect your Ambire wallet with email password or external signer on this device.'
        )
      },
      {
        icon: <PasswordIcon height={90} />,
        text: t(
          'First, pick your Ambire Key Store passphrase. It is unique for this device and it should be different from your account password.'
        )
      },
      {
        icon: <FingerprintIcon height={90} />,
        text: t(
          'You will use your passphrase to unlock the {{name}} and sign transactions on this device.',
          { name: isWeb ? t('Ambire extension') : t('Ambire Wallet') }
        )
      }
    ]
  }, [t])

  const renderItem = useCallback(({ item }) => {
    const Icon = item.icon
    return (
      <View
        style={[
          !IS_SCREEN_SIZE_S && spacings.phLg,
          spacings.pvTy,
          flexbox.alignCenter,
          { height: IS_SCREEN_SIZE_S ? 275 : 330 }
        ]}
      >
        <View style={spacings.mbSm}>{Icon}</View>
        <Text fontSize={16} style={[text.center, spacings.ph]}>
          {item.text}
        </Text>
      </View>
    )
  }, [])

  const keyExtractor = useCallback((item: OnboardingSlide) => item.text.toString(), [])

  return (
    <GradientBackgroundWrapper>
      <Wrapper
        contentContainerStyle={spacings.pbLg}
        type={WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW}
        extraHeight={220}
      >
        <AmbireLogo />

        <View style={[spacings.phTy]}>
          <Text
            weight="light"
            color={colors.titan}
            fontSize={16}
            style={[text.center, spacings.mbLg]}
          >
            {t('Welcome to the {{name}}. Let’s set up your Key Store passphrase.', {
              name: isWeb ? t('Ambire Wallet extension') : t('Ambire Wallet')
            })}
          </Text>
          <AppIntroSlider
            dotStyle={styles.dotStyle}
            activeDotStyle={styles.activeDotStyle}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            data={data}
            onDone={() => null}
            renderNextButton={() => <></>}
            renderDoneButton={() => <></>}
          />
        </View>

        <Button
          style={spacings.mt}
          text={t('Get Started')}
          onPress={() => navigate(ROUTES.createVault, { replace: true })}
        />
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default VaultSetupGetStartedScreen
