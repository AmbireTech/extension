import React, { useCallback, useState } from 'react'
import { Controller } from 'react-hook-form'
import { Image, Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { isValidPassword } from '@ambire-common/services/validations'
import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import FaceIDIcon from '@common/assets/svg/FaceIDIcon'
import FingerprintIcon from '@common/assets/svg/FingerprintIcon'
import LockIcon from '@common/assets/svg/LockIcon'
import Button from '@common/components/Button'
import FatToggle from '@common/components/FatToggle'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { DEVICE_SUPPORTED_AUTH_TYPES } from '@common/contexts/biometricsContext/constants'
import useBiometrics from '@common/hooks/useBiometrics'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
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
  const {
    state: { statuses, errorMessage },
    dispatch: keystoreDispatch
  } = useController('KeystoreController')
  const { theme } = useTheme()
  const { height } = useWindowSize()

  const { isEnrolled, isLoading, getBiometricsSecret, deviceSupportedAuthTypes } = useBiometrics()
  const hasFaceId = deviceSupportedAuthTypes.includes(
    DEVICE_SUPPORTED_AUTH_TYPES.FACIAL_RECOGNITION
  )
  const BiometricsIcon = hasFaceId ? FaceIDIcon : FingerprintIcon

  const [unlockMethod, setUnlockMethod] = useState<'biometrics' | 'password'>('password')
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  const handleBiometricsPrompt = useCallback(async () => {
    try {
      const biometricsSecret = await getBiometricsSecret()
      if (biometricsSecret) {
        keystoreDispatch({
          type: 'method',
          params: {
            method: 'unlockWithSecret',
            args: ['biometrics', biometricsSecret]
          }
        })
      }
    } catch (e) {
      console.log('Biometrics: Authentication failed or cancelled', e)
      // User cancelled or authentication failed (SecureStore throws/rejects on failure with requireAuthentication)
      // We don't need to do much here, the OS already showed the error/prompt.
    }
  }, [getBiometricsSecret, keystoreDispatch])

  React.useEffect(() => {
    if (!isLoading && !initialCheckDone) {
      setInitialCheckDone(true)
      if (isEnrolled) {
        setUnlockMethod('biometrics')
        handleBiometricsPrompt().catch(() => {})
      }
    }
  }, [isLoading, isEnrolled, initialCheckDone, handleBiometricsPrompt, getBiometricsSecret])

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent withScroll>
        <View style={{ height: height < 700 ? 260 : 324, ...spacings.mbSm }}>
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
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                height < 700 ? spacings.mbXl : spacings.mb3Xl
              ]}
            >
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

        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween,
            spacings.mbSm
          ]}
        >
          <Text appearance="secondaryText">{t('Hide balances')}</Text>
          <FatToggle
            isOn={false}
            onToggle={() => alert('Coming soon!')}
            width={44}
            height={22}
            style={spacings.mr0}
          />
        </View>
        <Animated.View style={flexbox.flex1} />
        {unlockMethod === 'password' ? (
          <>
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
            <Animated.View style={flexbox.flex1} />
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
            {isEnrolled && (
              <Button
                text={hasFaceId ? t('Unlock with Face ID') : t('Unlock with fingerprint')}
                type="secondary"
                hasBottomSpacing={false}
                onPress={() => {
                  setUnlockMethod('biometrics')
                  handleBiometricsPrompt().catch(() => {})
                }}
                style={spacings.mtSm}
                childrenPosition="left"
              >
                <BiometricsIcon
                  width={24}
                  height={24}
                  color={theme.primaryText}
                  style={spacings.mrSm}
                />
              </Button>
            )}
          </>
        ) : (
          <>
            <View style={[flexbox.alignCenter, flexbox.justifyCenter, flexbox.flex1]}>
              <Pressable
                style={{
                  width: 80,
                  height: 80,
                  ...flexbox.center,
                  borderRadius: 50,
                  backgroundColor: theme.secondaryBackground
                }}
                onPress={() => {
                  handleBiometricsPrompt().catch(() => {})
                }}
              >
                <BiometricsIcon width={72} height={72} color={theme.iconPrimary} />
              </Pressable>
            </View>
            <Animated.View style={flexbox.flex1} />
            <Button
              text={t('Unlock with password')}
              type="secondary"
              hasBottomSpacing={false}
              onPress={() => setUnlockMethod('password')}
            />
          </>
        )}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(KeyStoreUnlockScreen)
