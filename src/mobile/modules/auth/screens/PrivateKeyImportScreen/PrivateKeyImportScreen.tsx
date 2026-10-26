import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import PrivateKeyImportFields from '@common/modules/auth/components/PrivateKeyImportFields'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import usePrivateKeyImport from '@common/modules/auth/hooks/usePrivateKeyImport'
import spacings from '@common/styles/spacings'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const PrivateKeyImportScreen = () => {
  const {
    control,
    fields,
    addPrivateKeyField,
    removePrivateKeyField,
    canAddMore,
    handleFormSubmit,
    privateKeyFieldStates,
    isValid,
    isImporting,
    handleValidation,
    agreedToBackupWarning,
    setAgreedToBackupWarning
  } = usePrivateKeyImport()

  const { goToPrevRoute } = useOnboardingNavigation()
  const { t } = useTranslation()

  return (
    <MobileLayoutContainer
      // Only the fields scroll, so the checkbox and the button in the footer always stay visible
      footer={
        <View>
          <Checkbox
            value={agreedToBackupWarning}
            onValueChange={() => setAgreedToBackupWarning((prev) => !prev)}
            testID="backup-warning-checkbox"
            style={spacings.mlTy}
            label={
              <Text fontSize={14} appearance="secondaryText">
                {fields.length > 1
                  ? t('I know I must keep a secure backup of my keys.')
                  : t('I know I must keep a secure backup of my key.')}
              </Text>
            }
          />
          <Button
            testID="import-button"
            size="large"
            text={t('Confirm')}
            hasBottomSpacing={false}
            onPress={handleFormSubmit}
            disabled={!isValid || !agreedToBackupWarning || isImporting}
          />
        </View>
      }
    >
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Import private key')}
        withScroll
      >
        <PrivateKeyImportFields
          control={control}
          fields={fields}
          fieldStates={privateKeyFieldStates}
          canAddMore={canAddMore}
          onAdd={addPrivateKeyField}
          onRemove={removePrivateKeyField}
          handleValidation={handleValidation}
          onSubmitEditing={handleFormSubmit}
        />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default PrivateKeyImportScreen
