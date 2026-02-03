import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TextInput, View } from 'react-native'

import { isValidPassword } from '@ambire-common/services/validations'
import wait from '@ambire-common/utils/wait'
import Button from '@common/components/Button'
import InputPassword from '@common/components/InputPassword'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'

interface Props {
  onPasswordConfirmed: (password: string) => void
  onBackButtonPress: () => void
  text: string
  title?: string
  onCustomSubmit?: (password: string) => void
}

const PasswordConfirmation: React.FC<Props> = ({
  onPasswordConfirmed,
  onBackButtonPress,
  text,
  title = 'Confirm extension password',
  onCustomSubmit
}) => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const keystoreState = useKeystoreControllerState()
  const inputRef = useRef<TextInput | null>(null)
  const { navigate } = useNavigation()

  const setInputRef = useCallback((ref: TextInput | null) => {
    if (ref) inputRef.current = ref
  }, [])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      await wait(600)

      inputRef.current?.focus()
    })()
  }, [])

  // if using the onCustomSubmit method, it means we're using the
  // password confirmation for something different than unlocks
  const mode = onCustomSubmit ? 'custom' : 'unlock'

  useEffect(() => {
    if (mode === 'custom') return

    // if the user doesn't have a keystore password set, navigate him to set it
    if (!keystoreState.hasPasswordSecret) navigate(WEB_ROUTES.devicePasswordSet)
  }, [keystoreState.hasPasswordSecret, navigate, mode])

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: {
      password: ''
    }
  })

  const passwordFieldValue = watch('password')

  useEffect(() => {
    if (keystoreState.errorMessage) setError('password', { message: keystoreState.errorMessage })
    else if (keystoreState.statuses.unlockWithSecret === 'SUCCESS') {
      onPasswordConfirmed(passwordFieldValue)
    }
  }, [
    keystoreState.errorMessage,
    keystoreState.statuses.unlockWithSecret,
    setError,
    dispatch,
    onPasswordConfirmed,
    passwordFieldValue
  ])

  const handleUnlock = useCallback(
    (data: { password: string }) => {
      if (onCustomSubmit) {
        onCustomSubmit(data.password)
        return
      }

      dispatch({
        type: 'KEYSTORE_CONTROLLER_UNLOCK_WITH_SECRET',
        params: { secretId: 'password', secret: data.password }
      })
    },
    [dispatch, onCustomSubmit]
  )

  const passwordFieldError: string | undefined = useMemo(() => {
    if (!errors.password) return undefined

    if (passwordFieldValue.length < 8) {
      return t('Please fill in at least 8 characters for password.')
    }

    return errors.password.message || t('Invalid password')
  }, [errors.password, passwordFieldValue.length, t])

  return (
    <View style={flexbox.flex1}>
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
        <PanelBackButton onPress={onBackButtonPress} style={spacings.mrSm} />
        <PanelTitle title={t(title)} style={textStyles.left} />
      </View>
      <Controller
        control={control}
        rules={{ validate: isValidPassword }}
        render={({ field: { onChange, onBlur, value } }) => (
          <InputPassword
            setInputRef={setInputRef}
            testID="passphrase-field"
            onBlur={onBlur}
            placeholder={t('Enter password')}
            onChangeText={(val: string) => {
              onChange(val)
              if (keystoreState.errorMessage) {
                dispatch({ type: 'KEYSTORE_CONTROLLER_RESET_ERROR_STATE' })
              }
            }}
            label={text}
            isValid={isValidPassword(value)}
            value={value}
            onSubmitEditing={handleSubmit((data) => handleUnlock(data))}
            error={passwordFieldError}
          />
        )}
        name="password"
      />
      <View style={[flexbox.alignCenter, flexbox.flex1, flexbox.justifyEnd]}>
        <Button
          testID="button-submit"
          disabled={keystoreState.statuses.unlockWithSecret !== 'INITIAL' || !isValid}
          text={
            keystoreState.statuses.unlockWithSecret === 'LOADING' ? t('Submitting...') : t('Submit')
          }
          size="large"
          hasBottomSpacing={false}
          onPress={handleSubmit((data) => handleUnlock(data))}
        />
      </View>
    </View>
  )
}

export default React.memo(PasswordConfirmation)
