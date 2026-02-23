import React, { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Image, View } from 'react-native'

import { isValidPassword } from '@ambire-common/services/validations'
import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import LockIcon from '@common/assets/svg/LockIcon'
import Button from '@common/components/Button'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import { isDev, isTesting } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useDisableNavigatingBack from '@common/hooks/useDisableNavigatingBack'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import backgroundImage from '@common/modules/dashboard/components/DashboardOverview/background.png'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { DEFAULT_KEYSTORE_PASSWORD_DEV } from '@env'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper/MobileLayoutWrapper'

import getStyles from './styles'

const KeyStoreUnlockScreen = () => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { navigate } = useNavigation()
  const {
    state: { isUnlocked, statuses, errorMessage },
    dispatch: keystoreDispatch
  } = useController('KeystoreController')
  const { theme } = useTheme()
  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors }
  } = useForm({
    mode: 'all',
    defaultValues: {
      password: isDev && !isTesting ? (DEFAULT_KEYSTORE_PASSWORD_DEV ?? '') : ''
    }
  })

  useDisableNavigatingBack()

  const passwordFieldValue = watch('password')

  useEffect(() => {
    if (errorMessage) setError('password', { message: errorMessage })
  }, [errorMessage, setError])

  useEffect(() => {
    if (isUnlocked) navigate('/')
  }, [navigate, isUnlocked])

  const disableSubmit = useMemo(
    () => statuses.unlockWithSecret !== 'INITIAL' || !!errorMessage,
    [statuses.unlockWithSecret, errorMessage]
  )

  const passwordFieldError = useMemo(() => {
    if (!errors.password) return undefined

    if (passwordFieldValue.length < 8) {
      return t('Please fill in at least 8 characters for password.')
    }

    return errors.password.message || t('Invalid password')
  }, [errors.password, passwordFieldValue.length, t])

  const handleUnlock = useCallback(
    ({ password }: { password: string }) => {
      if (disableSubmit) return

      keystoreDispatch({
        type: 'method',
        params: {
          method: 'unlockWithSecret',
          args: ['password', password]
        }
      })
    },
    [disableSubmit, keystoreDispatch]
  )

  return (
    <MobileLayoutContainer backgroundColor={theme.secondaryBackground}>
      <MobileLayoutWrapperMainContent withScroll={true}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: backgroundImage }} style={styles.image as any} />
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb3Xl]}>
            <Text fontSize={20} weight="semiBold" color="#fff" appearance="primaryText">
              {t('Welcome Back')}
            </Text>
            <LockIcon width={24} height={24} color="#fff" style={spacings.mlTy} />
          </View>
          <AmbireLogoWithBackgroundAndLogotype color="#fff" style={spacings.mbXl} />
          <Text weight="medium" color={theme.neutral500} style={text.center}>
            {t('Easy and secure self-custody for the\nEthereum ecosystem')}
          </Text>
        </View>

        <View style={styles.container}>
          <Controller
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputPassword
                testID="passphrase-field"
                onBlur={onBlur}
                placeholder={t('Enter your password')}
                autoFocus={false}
                inputStyle={{ height: 54 }}
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
            style={{ width: '100%', marginBottom: 0 }}
            text={statuses.unlockWithSecret === 'LOADING' ? t('Unlocking...') : t('Unlock')}
            onPress={handleSubmit((data) => handleUnlock(data))}
          />
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(KeyStoreUnlockScreen)
