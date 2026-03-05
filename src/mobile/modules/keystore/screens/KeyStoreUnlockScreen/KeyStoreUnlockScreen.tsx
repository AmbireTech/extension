import React from 'react'
import { Controller } from 'react-hook-form'
import { Image, View } from 'react-native'
import {
  KeyboardAvoidingView,
  useReanimatedKeyboardAnimation
} from 'react-native-keyboard-controller'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'

import { isValidPassword } from '@ambire-common/services/validations'
import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import LockIcon from '@common/assets/svg/LockIcon'
import Button from '@common/components/Button'
import FatToggle from '@common/components/FatToggle'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useKeyStoreUnlock from '@common/modules/keystore/hooks/useKeyStoreUnlock'
import backgroundImage from '@common/modules/keystore/images/background.png'
import alert from '@common/services/alert'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const KeyStoreUnlockScreen = () => {
  const { control, handleSubmit, errors, passwordFieldError, disableSubmit, handleUnlock } =
    useKeyStoreUnlock()
  const { t } = useTranslation()

  const { hasKeystoreRecovery } = useController('EmailVaultController').state
  const { progress } = useReanimatedKeyboardAnimation()
  const spacerStyle = useAnimatedStyle(() => ({
    flex: 1 - progress.value
  }))
  const {
    state: { statuses, errorMessage },
    dispatch: keystoreDispatch
  } = useController('KeystoreController')
  const { theme } = useTheme()

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent withScroll={false}>
        <KeyboardAvoidingView
          behavior="position"
          // keyboardVerticalOffset={-50}
          style={flexbox.flex1}
          contentContainerStyle={flexbox.flex1}
        >
          <KeyboardAvoidingView behavior="height">
            <View style={{ height: 324, ...spacings.mbSm }}>
              <View
                style={{
                  height: '100%',
                  borderRadius: BORDER_RADIUS_PRIMARY,
                  overflow: 'hidden',
                  ...flexbox.center
                }}
              >
                <Image
                  source={
                    typeof backgroundImage === 'number' ? backgroundImage : { uri: backgroundImage }
                  }
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    objectFit: 'fill',
                    top: 0,
                    left: 0,
                    zIndex: -1
                  }}
                />
                <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb3Xl]}>
                  <Text fontSize={20} weight="semiBold" color="#fff" appearance="primaryText">
                    {t('Welcome Back')}
                  </Text>
                  <LockIcon width={24} height={24} color="#fff" style={spacings.mlTy} />
                </View>
                <AmbireLogoWithBackgroundAndLogotype color="#fff" style={spacings.mbXl} />
                <Text weight="medium" color="#B9BFC9" style={text.center}>
                  {t('Easy and secure self-custody for the\nEthereum ecosystem')}
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.mbSm
            ]}
          >
            <Text appearance="secondaryText">Hide balances</Text>
            <FatToggle
              isOn={false}
              onToggle={() => alert('Coming soon!')}
              width={44}
              height={22}
              style={spacings.mr0}
            />
          </View>
          <Animated.View style={spacerStyle} />
          <Controller
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputPassword
                testID="passphrase-field"
                onBlur={onBlur}
                placeholder={t('Enter your password')}
                autoFocus={isWeb}
                inputStyle={{ height: 54 }} // 56-2px border
                inputWrapperStyle={{ backgroundColor: theme.secondaryBackground, height: 56 }}
                onChangeText={(val: string) => {
                  onChange(val)
                  if (errorMessage) {
                    keystoreDispatch({
                      type: 'method',
                      params: {
                        method: 'resetErrorState',
                        args: []
                      }
                    })
                  }
                }}
                isValid={!errors.password && isValidPassword(value)}
                value={value}
                onSubmitEditing={handleSubmit((data) => handleUnlock(data))}
                error={passwordFieldError}
                containerStyle={{ ...spacings.mb, width: '100%' }}
              />
            )}
            name="password"
          />
          <Button
            testID="button-unlock"
            disabled={disableSubmit}
            hasBottomSpacing={false}
            text={statuses.unlockWithSecret === 'LOADING' ? t('Unlocking...') : t('Unlock')}
            onPress={handleSubmit((data) => handleUnlock(data))}
          />
          <Animated.View style={spacerStyle} />
          {!!hasKeystoreRecovery && (
            <Button
              text={t('Forgot extension password?')}
              type="ghost2"
              hasBottomSpacing={false}
              onPress={() => alert('Coming soon!')}
              style={spacings.mtSm}
              textStyle={{ textDecorationLine: 'underline' }}
            />
          )}
        </KeyboardAvoidingView>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(KeyStoreUnlockScreen)
