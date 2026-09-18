import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TextInput, View } from 'react-native'

import { isValidPassword } from '@ambire-common/services/validations'
import BiometricsPrompt, { SwitchToBiometricsButton } from '@common/components/BiometricsPrompt'
import Button from '@common/components/Button'
import InputPassword from '@common/components/InputPassword'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import {
  useIsBottomSheetOpen,
  useIsInsideBottomSheet
} from '@common/components/BottomSheet/BottomSheetContext'
import { isDev, isMobile, isTesting, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useBiometricsAvailability from '@common/hooks/useBiometricsAvailability'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useSecretConfirmation from '@common/hooks/useSecretConfirmation'
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
  /**
   * Runs when the user proved who they are with biometrics. Leave it out where the password
   * itself is needed (encrypting an export, say) - biometrics produce no password to hand over.
   */
  onBiometricsConfirmed?: () => void
  /**
   * Lays the confirmation over the whole modal instead of stacking it at the top: icon centred,
   * the way out at the bottom, full width buttons. For the taller modals.
   */
  withFullHeightLayout?: boolean
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
  withAutoFocus = true,
  onBiometricsConfirmed,
  withFullHeightLayout
}) => {
  const { t } = useTranslation()
  const isBottomSheetOpen = useIsBottomSheetOpen()
  const isInsideBottomSheet = useIsInsideBottomSheet()
  const { state: keystoreState, dispatch: keystoreDispatch } = useController('KeystoreController')
  const inputRef = useRef<TextInput | null>(null)
  const { navigate } = useNavigation()

  const setInputRef = useCallback((ref: TextInput | null) => {
    if (ref) inputRef.current = ref
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
      password: isDev && !isTesting ? (DEFAULT_KEYSTORE_PASSWORD_DEV ?? '') : ''
    }
  })

  const passwordFieldValue = watch('password')

  // The status sits on SUCCESS for a moment, so the effect would fire for every render in that
  // window. Latched to the one transition, or a caller that can only run once is invoked twice.
  const hasConfirmedRef = useRef(false)

  useEffect(() => {
    if (keystoreState.errorMessage) {
      setError('password', { message: keystoreState.errorMessage })
      return
    }

    if (keystoreState.statuses.unlockWithSecret !== 'SUCCESS') {
      hasConfirmedRef.current = false
      return
    }

    if (hasConfirmedRef.current) return

    hasConfirmedRef.current = true
    onPasswordConfirmed(passwordFieldValue)
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

  // Read here rather than off `useSecretConfirmation`, because the title it builds is what that
  // hook is given for the operating system's own prompt
  const { biometricsAuthLabel } = useBiometricsAvailability()
  const biometricsTitle = t('Confirm with {{biometricsAuthLabel}}', { biometricsAuthLabel })

  const handleBiometricsConfirmed = useCallback(() => {
    onBiometricsConfirmed?.()
  }, [onBiometricsConfirmed])

  const {
    isUsingBiometrics,
    canUseBiometrics,
    BiometricsIcon,
    isVerifying,
    errorMessage: biometricsErrorMessage,
    confirmWithBiometrics,
    autoPromptBiometrics,
    cancelAutoPrompt,
    switchToPassword,
    reset: resetSecretConfirmation
  } = useSecretConfirmation({
    onConfirmed: handleBiometricsConfirmed,
    promptMessage: `${biometricsTitle}\n${text}`
  })

  const isOfferingBiometrics = !!onBiometricsConfirmed && canUseBiometrics

  useEffect(() => {
    if (!withAutoFocus) return undefined
    // Inside a sheet the content is mounted with the screen rather than when the sheet opens, so
    // the field waits for it to be up. Outside one there is nothing to wait for.
    if (isInsideBottomSheet && !isBottomSheetOpen) return undefined
    // Nothing to focus while biometrics are what is being asked for
    if (isOfferingBiometrics && isUsingBiometrics) return undefined

    const focusTimeout = setTimeout(() => inputRef.current?.focus(), FOCUS_DELAY)

    return () => clearTimeout(focusTimeout)
  }, [
    withAutoFocus,
    isInsideBottomSheet,
    isBottomSheetOpen,
    isOfferingBiometrics,
    isUsingBiometrics
  ])
  // The panel says what is actually being asked for, so it does not read "password" while the
  // fingerprint or face prompt is the thing on screen
  const panelTitle = isOfferingBiometrics && isUsingBiometrics ? biometricsTitle : t(title)

  // Sheet content mounts with the screen, so the prompt waits for the sheet to actually come up.
  // Once per opening, the way the signing sheet and the unlock screen both do it.
  const hasAutoPromptedRef = useRef(false)

  useEffect(() => {
    if (!isBottomSheetOpen) {
      hasAutoPromptedRef.current = false
      cancelAutoPrompt()
      return
    }

    if (!isOfferingBiometrics || !isUsingBiometrics || hasAutoPromptedRef.current) return

    hasAutoPromptedRef.current = true
    // Clears whatever the previous confirmation left behind before asking for a new one
    resetSecretConfirmation()
    autoPromptBiometrics()
  }, [
    isBottomSheetOpen,
    isOfferingBiometrics,
    isUsingBiometrics,
    autoPromptBiometrics,
    cancelAutoPrompt,
    resetSecretConfirmation
  ])

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
        <PanelTitle title={panelTitle} style={isWeb ? textStyles.left : textStyles.center} />
      </View>
      {isOfferingBiometrics && isUsingBiometrics ? (
        <BiometricsPrompt
          BiometricsIcon={BiometricsIcon}
          isVerifying={isVerifying}
          errorMessage={biometricsErrorMessage}
          onConfirm={confirmWithBiometrics}
          onSwitchToPassword={switchToPassword}
          fillHeight={withFullHeightLayout}
        />
      ) : (
        <>
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
              isWeb && !withFullHeightLayout && flexbox.alignCenter,
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
            {!!isOfferingBiometrics && (
              <SwitchToBiometricsButton
                BiometricsIcon={BiometricsIcon}
                isVerifying={isVerifying}
                onPress={confirmWithBiometrics}
              />
            )}
          </View>
        </>
      )}
    </View>
  )
}

export default React.memo(PasswordConfirmation)
