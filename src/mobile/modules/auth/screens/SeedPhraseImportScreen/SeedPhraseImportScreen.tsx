import React from 'react'
import { Controller } from 'react-hook-form'
import { View } from 'react-native'

import Button from '@common/components/Button'
import InputPassword from '@common/components/InputPassword'
import PassphraseToggle from '@common/components/PassphraseToggle'
import { useTranslation } from '@common/config/localization'
import { NO_AUTOFILL_PROPS } from '@common/constants/textInput'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import useSeedPhraseImport from '@common/modules/auth/hooks/useSeedPhraseImport'
import getStyles from '@common/modules/auth/styles/seedPhraseImportScreenStyles'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

import SeedPhraseInput from './SeedPhraseInput'

const SeedPhraseImportScreen = () => {
  const {
    importButtonPressed,
    control,
    isValid,
    enablePassphrase,
    toggleEnablePassphrase,
    shouldSavePassphrase,
    toggleShouldSavePassphrase,
    seedPhraseStatus,
    seedPhraseError,
    seedCaretPosition,
    setSeedCaretPosition,
    handleFormSubmit,
    validateSeedPhrase
  } = useSeedPhraseImport()
  const { goToPrevRoute } = useOnboardingNavigation()
  const { t } = useTranslation()

  const { theme, styles } = useTheme(getStyles)

  return (
    <MobileLayoutContainer
      footer={
        <Button
          testID="import-button"
          size="large"
          text={t('Confirm')}
          hasBottomSpacing={false}
          onPress={handleFormSubmit}
          disabled={!isValid || importButtonPressed}
        />
      }
    >
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Import recovery phrase')}
        withScroll
      >
        <Controller
          control={control}
          rules={{
            required: true,
            validate: validateSeedPhrase
          }}
          name="seed"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.textAreaWrapper}>
              <SeedPhraseInput
                value={value}
                status={seedPhraseStatus}
                error={seedPhraseError}
                caretPosition={seedCaretPosition}
                onCaretPositionChange={setSeedCaretPosition}
                onChangeText={onChange}
                onBlur={onBlur}
                onSubmitEditing={handleFormSubmit}
              />
            </View>
          )}
        />
        <PassphraseToggle
          testID="enable-passphrase-toggle"
          title={t('I have a passphrase')}
          description={t('Not sure? Leave it off.')}
          isOn={enablePassphrase}
          onToggle={toggleEnablePassphrase}
        />
        {enablePassphrase ? (
          <>
            <View style={styles.passphraseContainer}>
              <Controller
                control={control}
                rules={{ required: enablePassphrase }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <InputPassword
                    {...NO_AUTOFILL_PROPS}
                    testID="input-passphrase"
                    onBlur={onBlur}
                    backgroundColor={theme.secondaryBackground}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Passphrase"
                    containerStyle={flexbox.flex1}
                  />
                )}
                name="passphrase"
              />
            </View>
            <PassphraseToggle
              testID="save-passphrase-toggle"
              title={t('Save passphrase')}
              description={t("You won't be asked for it next time you add accounts.")}
              isOn={shouldSavePassphrase}
              onToggle={toggleShouldSavePassphrase}
            />
          </>
        ) : null}
        <View style={flexbox.flex1} />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(SeedPhraseImportScreen)
