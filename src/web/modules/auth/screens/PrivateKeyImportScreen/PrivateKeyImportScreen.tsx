import React from 'react'
import { ScrollView, View } from 'react-native'

import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import PrivateKeyImportFields from '@common/modules/auth/components/PrivateKeyImportFields'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import usePrivateKeyImport from '@common/modules/auth/hooks/usePrivateKeyImport'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

export const CARD_WIDTH = 400

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

  const { theme } = useTheme()

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent>
        <Panel
          type="onboarding"
          spacingsSize="small"
          withBackButton
          onBackButtonPress={goToPrevRoute}
          title={t('Import private key')}
          step={1}
          totalSteps={2}
        >
          <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
            {/* Only the fields scroll, so the checkbox and the button below always stay visible */}
            <ScrollView style={spacings.mbLg}>
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
            </ScrollView>
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
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default PrivateKeyImportScreen
