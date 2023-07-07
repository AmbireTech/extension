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
        title: 'Setup your Key Store PIN',
        icon: <KeyStoreIcon height={90} />,
        text: t('Protect your account passwords or external signers with PIN on this device')
      },
      {
        title: 'Sign transactions using PIN or biometrics',
        icon: <PasswordIcon height={90} />,
        text: t('You can unlock wallet and sign transactions using Key Store PIN only')
      },
      {
        title: 'Your PIN is unique to this device',
        icon: <FingerprintIcon height={90} />,
        text: t('Use your PIN to unlock Ambire and sign transactions')
      }
    ]
  }, [t])

  const renderItem = useCallback(({ item }) => {
    const Icon = item.icon
    return (
      <View style={{ height: IS_SCREEN_SIZE_S ? 350 : 400 }}>
        <Text
          weight="medium"
          color={colors.titan}
          fontSize={18}
          style={[text.center, spacings.mbLg]}
        >
          {item.title}
        </Text>
        <View style={[!IS_SCREEN_SIZE_S && spacings.phLg, spacings.pvTy, flexbox.alignCenter]}>
          <View style={spacings.mbSm}>{Icon}</View>
          <Text fontSize={16} style={[text.center, spacings.ph]}>
            {item.text}
          </Text>
        </View>
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
