import React from 'react'
import { Controller } from 'react-hook-form'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { NO_AUTOFILL_PROPS } from '@common/constants/textInput'
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
    fields,
    handleFormSubmit,
    getPrivateKeyError,
    isValid,
    handleValidation,
    agreedToBackupWarning,
    setAgreedToBackupWarning
  } = usePrivateKeyImport()

  const { goToPrevRoute } = useOnboardingNavigation()
  const { t } = useTranslation()

  const { theme } = useTheme()

  return (
    <MobileLayoutContainer
      footer={
        <Button
          testID="import-button"
          size="large"
          text={t('Confirm')}
          hasBottomSpacing={false}
          onPress={handleFormSubmit}
          disabled={!isValid || !agreedToBackupWarning}
        />
      }
    >
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Import private key')}
        withScroll
      >
        <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
          <View>
            {fields.map((field, index) => (
              <Controller
                key={field.id}
                control={control}
                rules={{ validate: (value) => handleValidation(value), required: true }}
                name={`privateKeys.${index}.value`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    {...NO_AUTOFILL_PROPS}
                    testID={
                      index === 0 ? 'enter-private-key-field' : `enter-private-key-field-${index}`
                    }
                    onBlur={onBlur}
                    autoFocus={index === 0}
                    placeholder={t('Input private key')}
                    onChangeText={onChange}
                    value={value}
                    isValid={
                      !!value.length && !handleValidation(value) && !getPrivateKeyError(index)
                    }
                    validLabel={t('✅ Valid private key')}
                    secureTextEntry
                    containerStyle={spacings.mbLg}
                    backgroundColor={theme.secondaryBackground}
                    error={value.length ? getPrivateKeyError(index) : ''}
                    autoCorrect={false}
                    onSubmitEditing={handleFormSubmit}
                  />
                )}
              />
            ))}
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
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default PrivateKeyImportScreen
