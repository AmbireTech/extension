import React from 'react'
import { Controller } from 'react-hook-form'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import usePrivateKeyImport from '@common/modules/auth/hooks/usePrivateKeyImport'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const PrivateKeyImportScreen = () => {
  const {
    control,
    handleFormSubmit,
    errors,
    isValid,
    handleValidation,
    agreedToBackupWarning,
    setAgreedToBackupWarning
  } = usePrivateKeyImport()

  const { goToPrevRoute } = useOnboardingNavigation()
  const { t } = useTranslation()

  const { theme } = useTheme()

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Import private key')}
        step={1}
        totalSteps={2}
      >
        <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
          <View>
            <Controller
              control={control}
              rules={{ validate: (value) => handleValidation(value), required: true }}
              name="privateKey"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  testID="enter-private-key-field"
                  onBlur={onBlur}
                  autoFocus
                  placeholder={t('Input private key')}
                  onChangeText={onChange}
                  value={value}
                  isValid={!handleValidation(value) && !!value.length}
                  validLabel={t('✅ Valid private key')}
                  secureTextEntry
                  containerStyle={spacings.mbLg}
                  backgroundColor={theme.secondaryBackground}
                  error={value.length ? errors?.privateKey?.message : ''}
                  autoCorrect={false}
                  onSubmitEditing={handleFormSubmit}
                />
              )}
            />
            <Checkbox
              value={agreedToBackupWarning}
              onValueChange={() => setAgreedToBackupWarning((prev) => !prev)}
              testID="backup-warning-checkbox"
              style={spacings.mlTy}
              label={
                <Text fontSize={14} appearance="secondaryText">
                  {t('I know I must keep a secure backup of my key.')}
                </Text>
              }
            />
          </View>

          <Button
            testID="import-button"
            size="large"
            text={t('Confirm')}
            hasBottomSpacing={false}
            onPress={handleFormSubmit}
            disabled={!isValid || !agreedToBackupWarning}
          />
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default PrivateKeyImportScreen
