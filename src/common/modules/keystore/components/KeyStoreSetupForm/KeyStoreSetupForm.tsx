import React, { useCallback, useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { View } from 'react-native'

import { isValidPassword } from '@ambire-common/services/validations'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import InputPassword from '@common/components/InputPassword'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { TERMS_VERSION } from '@common/modules/terms/components/TermsComponent'
import { storage } from '@common/services/storage'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useKeyStoreSetup from '@web/modules/keystore/components/KeyStoreSetupForm/hooks/useKeyStoreSetup'

type Props = {
  agreedWithTerms: boolean
  onBeforeKeystoreSetup?: (password: string) => Promise<boolean>
  onConfirmSuccess?: (password: string) => void | Promise<void>
  children?: React.ReactNode
}

const KeyStoreSetupForm = ({
  agreedWithTerms,
  onBeforeKeystoreSetup,
  onConfirmSuccess,
  children
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const {
    control,
    handleKeystoreSetup,
    password,
    isKeystoreSetupLoading,
    isKeystoreReady,
    formState
  } = useKeyStoreSetup()
  const { goToNextRoute } = useOnboardingNavigation()
  useEffect(() => {
    const handleSuccess = async () => {
      if (isKeystoreReady) {
        if (onConfirmSuccess) await onConfirmSuccess(password)
        goToNextRoute()
      }
    }
    handleSuccess().catch(() => {})
  }, [isKeystoreReady, goToNextRoute, onConfirmSuccess, password])

  const onConfirmAction = useCallback(async () => {
    if (onBeforeKeystoreSetup) {
      const proceed = await onBeforeKeystoreSetup(password)
      if (!proceed) return
    }
    await handleKeystoreSetup()
  }, [handleKeystoreSetup, onBeforeKeystoreSetup, password])

  const handleCreateButtonPress = useCallback(async () => {
    await storage.set('termsState', { version: TERMS_VERSION, acceptedAt: Date.now() })
    await onConfirmAction()
  }, [onConfirmAction])

  const Wrapper = isWeb ? ScrollableWrapper : View

  return (
    <>
      <Wrapper style={isMobile ? flexbox.flex1 : {}}>
        <Controller
          control={control}
          rules={{ validate: isValidPassword }}
          render={({ field: { onChange, onBlur, value } }) => (
            <InputPassword
              backgroundColor={theme.secondaryBackground}
              label={t('Password')}
              testID="enter-pass-field"
              onBlur={onBlur}
              placeholder={t('Enter password')}
              onChangeText={onChange}
              isValid={isValidPassword(value)}
              autoFocus
              value={value}
              error={
                formState.errors.password &&
                (t('Your password must be unique and at least 8 characters long.') as string)
              }
              containerStyle={spacings.mbXl}
              onSubmitEditing={handleCreateButtonPress}
            />
          )}
          name="password"
        />
        <Controller
          control={control}
          rules={{
            validate: (value) => password === value
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              backgroundColor={theme.secondaryBackground}
              label={t('Repeat password')}
              testID="repeat-pass-field"
              onBlur={onBlur}
              placeholder={t('Enter password')}
              onChangeText={onChange}
              value={value}
              isValid={!!value && !formState.errors.password && password === value}
              validLabel={t('Passwords match')}
              secureTextEntry
              error={formState.errors.confirmPassword && (t("Passwords don't match.") as string)}
              autoCorrect={false}
              onSubmitEditing={onConfirmAction}
            />
          )}
          name="confirmPassword"
        />
        {children}
      </Wrapper>
      <View style={spacings.pt}>
        <Button
          testID="create-keystore-pass-btn"
          size="large"
          disabled={
            formState.isSubmitting ||
            isKeystoreSetupLoading ||
            !formState.isValid ||
            !agreedWithTerms
          }
          text={formState.isSubmitting || isKeystoreSetupLoading ? t('Loading...') : t('Confirm')}
          onPress={onConfirmAction}
          hasBottomSpacing={false}
        />
      </View>
    </>
  )
}

export default React.memo(KeyStoreSetupForm)
