import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TextInput, View } from 'react-native'

import { isValidPassword } from '@ambire-common/services/validations'
import Button from '@common/components/Button'
import InputPassword from '@common/components/InputPassword'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import { isDev, isMobile, isTesting, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import { DEFAULT_KEYSTORE_PASSWORD_DEV } from '@env'

interface Props {
  onPasswordConfirmed: (password: string) => void
  onBackButtonPress: () => void
  text: string
  title?: string
  onCustomSubmit?: (password: string) => void
  /** Rendered between the password field and the submit button */
  children?: React.ReactNode
  submitText?: string
  isSubmitting?: boolean
  /**
   * Focuses the field shortly after mount. Turn it off when the component sits in a
   * bottom sheet that opens later, where the field is tapped to be focused instead.
   */
  withAutoFocus?: boolean
}

// Long enough for the panel the field sits in to finish animating in, otherwise
// focusing it does nothing and the keyboard stays down
const FOCUS_DELAY = 600

const PasswordConfirmation: React.FC<Props> = ({
  onPasswordConfirmed,
  onBackButtonPress,
  text,
  title = isMobile ? 'Confirm app password' : 'Confirm extension password',
  onCustomSubmit,
  children,
  submitText,
  isSubmitting: isSubmittingCustom,
  withAutoFocus = true
}) => {
  const { t } = useTranslation()
  const { state: keystoreState, dispatch: keystoreDispatch } = useController('KeystoreController')
  const inputRef = useRef<TextInput | null>(null)
  const { navigate } = useNavigation()

  const setInputRef = useCallback((ref: TextInput | null) => {
    if (ref) inputRef.current = ref
  }, [])

  useEffect(() => {
    if (!withAutoFocus) return undefined

    const focusTimeout = setTimeout(() => inputRef.current?.focus(), FOCUS_DELAY)

    return () => clearTimeout(focusTimeout)
  }, [withAutoFocus])

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
      password: isDev && !isTesting ? (DEFAULT_KEYSTORE_PASSWORD_DEV ?? '') : ''
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
    onPasswordConfirmed,
    passwordFieldValue
  ])

  const handleUnlock = useCallback(
    (data: { password: string }) => {
      if (onCustomSubmit) {
        onCustomSubmit(data.password)
        return
      }

      keystoreDispatch({
        type: 'method',
        params: {
          method: 'unlockWithSecret',
          args: ['password', data.password]
        }
      })
    },
    [keystoreDispatch, onCustomSubmit]
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
        {isWeb && <PanelBackButton onPress={onBackButtonPress} style={spacings.mrSm} />}
        <PanelTitle title={t(title)} style={isWeb ? textStyles.left : textStyles.center} />
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
                keystoreDispatch({
                  type: 'method',
                  params: {
                    method: 'resetErrorState',
                    args: []
                  }
                })
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
      {children}
      <View
        style={[
          isMobile && spacings.pt2Xl,
          isWeb && flexbox.alignCenter,
          flexbox.flex1,
          flexbox.justifyEnd
        ]}
      >
        <Button
          testID="button-submit"
          disabled={
            keystoreState.statuses.unlockWithSecret !== 'INITIAL' ||
            !isValid ||
            !!isSubmittingCustom
          }
          text={
            keystoreState.statuses.unlockWithSecret === 'LOADING' || isSubmittingCustom
              ? t('Submitting...')
              : submitText || t('Submit')
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
