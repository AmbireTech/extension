import React from 'react'
import { Controller } from 'react-hook-form'
import { View } from 'react-native'

import Button from '@common/components/Button'
import FatToggle from '@common/components/FatToggle'
import InputPassword from '@common/components/InputPassword'
import { useTranslation } from '@common/config/localization'
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
    control,
    isValid,
    enablePassphrase,
    setEnablePassphrase,
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
          disabled={!isValid}
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
        <FatToggle
          testID="enable-passphrase-toggle"
          isOn={enablePassphrase}
          onToggle={() => setEnablePassphrase((prev) => !prev)}
          label={t('Advanced mode')}
          width={44}
          height={24}
          style={flexbox.alignSelfStart}
        />
        {enablePassphrase ? (
          <View style={styles.passphraseContainer}>
            <Controller
              control={control}
              rules={{ required: enablePassphrase }}
              render={({ field: { onChange, onBlur, value } }) => (
                <InputPassword
                  testID="input-passphrase"
                  onBlur={onBlur}
                  backgroundColor={theme.secondaryBackground}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Recovery phrase passphrase"
                  containerStyle={flexbox.flex1}
                />
              )}
              name="passphrase"
            />
          </View>
        ) : null}
        <View style={flexbox.flex1} />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(SeedPhraseImportScreen)
