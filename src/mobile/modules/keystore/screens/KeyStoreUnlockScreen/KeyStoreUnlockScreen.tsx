import React, { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Image, View } from 'react-native'

import { isValidPassword } from '@ambire-common/services/validations'
import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import LockIcon from '@common/assets/svg/LockIcon'
import Button from '@common/components/Button'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import { isDev, isTesting, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useDisableNavigatingBack from '@common/hooks/useDisableNavigatingBack'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import backgroundImage from '@common/modules/dashboard/components/DashboardOverview/background.png'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { DEFAULT_KEYSTORE_PASSWORD_DEV } from '@env'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'

import getStyles from './styles'

const KeyStoreUnlockScreen = () => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { navigate } = useNavigation()
  const { hasKeystoreRecovery } = useController('EmailVaultController').state
  const {
    state: { isUnlocked, statuses, errorMessage },
    dispatch: keystoreDispatch
  } = useController('KeystoreController')
  const { requestWindow } = useController('RequestsController').state
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
    <MobileLayoutContainer style={styles.panel}>
      <View style={flexbox.flex1}>
        <View
          style={{
            height: 324,
            width: '100%',
            marginBottom: 56
          }}
        >
          <View
            style={{
              width: '100%',
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
            <Text weight="medium" color={theme.neutral500} style={text.center}>
              {t('Easy and secure self-custody for the\nEthereum ecosystem')}
            </Text>
          </View>
        </View>
        <View style={styles.container}>
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
            style={{ width: '100%', marginBottom: 0 }}
            text={statuses.unlockWithSecret === 'LOADING' ? t('Unlocking...') : t('Unlock')}
            onPress={handleSubmit((data) => handleUnlock(data))}
          />

          {/* {hasKeystoreRecovery && (
          <TouchableOpacity
            onPress={() =>
              openInternalPageInTab({
                route: ROUTES.keyStoreEmailRecovery,
                shouldCloseCurrentWindow: !getUiType().isTab,
                windowId: requestWindow?.windowProps?.createdFromWindowId
              })
            }
            style={spacings.mtXl}
            hitSlop={FOOTER_BUTTON_HIT_SLOP}
          >
            <Text weight="medium" appearance="secondaryText" fontSize={14} underline>
              {t('Forgot extension password?')}
            </Text>
          </TouchableOpacity>
        )} */}
        </View>
      </View>
    </MobileLayoutContainer>
  )
}

export default React.memo(KeyStoreUnlockScreen)
