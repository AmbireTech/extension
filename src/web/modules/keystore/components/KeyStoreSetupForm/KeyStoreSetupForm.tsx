import React, { useCallback, useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { View } from 'react-native'

import { isValidPassword } from '@ambire-common/services/validations'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import InputPassword from '@common/components/InputPassword'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings from '@common/styles/spacings'
import storage from '@web/extension-services/background/webapi/storage'
import useKeyStoreSetup from '@web/modules/keystore/components/KeyStoreSetupForm/hooks/useKeyStoreSetup'
import { TERMS_VERSION } from '@web/modules/terms/components/TermsComponent'

type Props = {
  agreedWithTerms: boolean
  children?: React.ReactNode
}

const KeyStoreSetupForm = ({ agreedWithTerms, children }: Props) => {
  const { t } = useTranslation()
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
    if (isKeystoreReady) goToNextRoute()
  }, [isKeystoreReady, goToNextRoute])

  const handleCreateButtonPress = useCallback(async () => {
    await storage.set('termsState', { version: TERMS_VERSION, acceptedAt: Date.now() })
    await handleKeystoreSetup()
  }, [handleKeystoreSetup])

  return (
    <View>
      <Controller
        control={control}
        rules={{ validate: isValidPassword }}
        render={({ field: { onChange, onBlur, value } }) => (
          <InputPassword
            label={t('Password')}
            testID="enter-pass-field"
            onBlur={onBlur}
            placeholder={t('Enter password')}
            onChangeText={onChange}
            isValid={isValidPassword(value)}
            autoFocus={isWeb}
            value={value}
            error={
              formState.errors.password &&
              (t('Your password must be unique and at least 8 characters long.') as string)
            }
            containerStyle={spacings.mbTy}
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
            onSubmitEditing={handleKeystoreSetup}
          />
        )}
        name="confirmPassword"
      />
      {children}
      <Button
        testID="create-keystore-pass-btn"
        size="large"
        disabled={
          formState.isSubmitting || isKeystoreSetupLoading || !formState.isValid || !agreedWithTerms
        }
        text={formState.isSubmitting || isKeystoreSetupLoading ? t('Loading...') : t('Confirm')}
        onPress={handleKeystoreSetup}
        hasBottomSpacing={false}
      />
    </View>
  )
}

export default React.memo(KeyStoreSetupForm)
