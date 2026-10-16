import React from 'react'
import { View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import PrivateKeyImportField from '@common/modules/auth/components/PrivateKeyImportField'
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
            disabled={!isValid || !agreedToBackupWarning}
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
        {fields.map((field, index) => (
          <PrivateKeyImportField
            key={field.id}
            control={control}
            index={index}
            canRemove={fields.length > 1}
            onRemove={removePrivateKeyField}
            handleValidation={handleValidation}
            getPrivateKeyError={getPrivateKeyError}
            onSubmitEditing={handleFormSubmit}
          />
        ))}
        <Button
          type="outline"
          testID="add-one-more-private-key"
          disabled={!canAddMore}
          style={{ height: 40 }}
          size="tiny"
          onPress={addPrivateKeyField}
          childrenPosition="left"
          text={t('Add another private key')}
          hasBottomSpacing={false}
        >
          <AddCircularIcon width={20} height={20} color={theme.primaryText} style={spacings.mrMi} />
        </Button>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default PrivateKeyImportScreen
