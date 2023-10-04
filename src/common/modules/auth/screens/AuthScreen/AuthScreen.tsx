import React, { useCallback } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import EmailIcon from '@common/assets/svg/EmailIcon'
import HWIcon from '@common/assets/svg/HWIcon'
import ImportIcon from '@common/assets/svg/ImportIcon'
import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import BottomSheet from '@common/components/BottomSheet'
import Button, { Props as ButtonDefaultProps } from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Panel from '@common/components/Panel'
import Title from '@common/components/Title'
import Wrapper from '@common/components/Wrapper'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, { IS_SCREEN_SIZE_S } from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

interface ButtonProps extends Omit<ButtonDefaultProps, 'onPress'> {
  routeName: ROUTES
  Icon: React.ReactElement
  text: string
  onPress: (nextRoute: ROUTES) => void
}

const AuthButton = React.memo(
  ({ text, Icon, type = 'primary', routeName, onPress }: ButtonProps) => {
    const handleButtonPress = useCallback(() => {
      !!onPress && onPress(routeName)
    }, [onPress, routeName])

    return (
      <Panel type="filled" contentContainerStyle={[spacings.ph, spacings.pb, spacings.ptMi]}>
        <View style={[flexboxStyles.alignCenter, spacings.mbTy]}>{!!Icon && Icon}</View>
        <Button text={text} type={type} onPress={handleButtonPress} hasBottomSpacing={false} />
      </Panel>
    )
  }
)

const AuthScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const handleAuthButtonPress = useCallback((nextRoute: ROUTES) => navigate(nextRoute), [navigate])

  return (
    <GradientBackgroundWrapper>
      <Wrapper>
        <View style={[flexboxStyles.alignCenter, spacings.mbMd]}>
          {!IS_SCREEN_SIZE_S && <AmbireLogoHorizontal width={132} height={60} />}
        </View>
        <View style={flexboxStyles.flex1}>
          <AuthButton
            text={t('Proceed With Email')}
            Icon={<EmailIcon />}
            routeName={ROUTES.ambireAccountLogin}
            onPress={handleAuthButtonPress}
          />
          <AuthButton
            text={t('Proceed With Nano Ledger X')}
            Icon={<HWIcon />}
            routeName={ROUTES.hardwareWallet}
            onPress={handleAuthButtonPress}
            style={spacings.mbLg}
          />
          <AuthButton
            text={t('Proceed With External Signer')}
            Icon={<ImportIcon />}
            routeName={ROUTES.externalSigner}
            onPress={handleAuthButtonPress}
          />
          <View style={flexboxStyles.alignCenter}>
            <Button text={t('More Options')} type="secondary" onPress={openBottomSheet} />
          </View>
        </View>
      </Wrapper>
      <BottomSheet id="more-login-options" sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
        <Title style={textStyles.center}>{t('More options')}</Title>
        <View style={spacings.pv}>
          <Button
            text={t('Import From JSON')}
            type="outline"
            onPress={() => {
              navigate(ROUTES.ambireAccountJsonLogin)
              closeBottomSheet()
            }}
            hasBottomSpacing={false}
          />
        </View>
      </BottomSheet>
    </GradientBackgroundWrapper>
  )
}

export default React.memo(AuthScreen)
