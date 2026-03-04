import { wordlists } from 'bip39'
import React from 'react'
import { Controller } from 'react-hook-form'
import { View } from 'react-native'

import Button from '@common/components/Button'
import FatToggle from '@common/components/FatToggle'
import InputPassword from '@common/components/InputPassword'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import TextArea from '@common/components/TextArea'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import useSeedPhraseImport from '@common/modules/auth/hooks/useSeedPhraseImport'
import getStyles from '@common/modules/auth/styles/seedPhraseImportScreenStyles'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const SeedPhraseImportScreen = () => {
  const {
    control,
    isValid,
    enablePassphrase,
    setEnablePassphrase,
    seedPhraseStatus,
    handleFormSubmit,
    validateSeedPhraseWord
  } = useSeedPhraseImport()
  const { goToPrevRoute } = useOnboardingNavigation()
  const { t } = useTranslation()

  const { theme, styles } = useTheme(getStyles)

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Import recovery phrase')}
        step={1}
        totalSteps={2}
      >
        <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
          <ScrollableWrapper>
            <Controller
              control={control}
              rules={{
                required: true,
                validate: validateSeedPhraseWord
              }}
              name="seed"
              render={({ field: { onChange, onBlur, value } }) => {
                const words = value.split(/(\s+)/)

                const styledOverlay = (
                  <View style={[styles.overlay, { paddingVertical: 16, paddingHorizontal: 13 }]}>
                    {words.map((word, index) => {
                      const isWhitespace = /^\s+$/.test(word)
                      const cleanWord = word.trim().toLowerCase()
                      const isValidWord = isWhitespace || wordlists.english?.includes(cleanWord)

                      if (isWhitespace) {
                        return (
                          <Text
                            key={`space-${String(index)}`}
                            fontSize={14}
                            style={{ letterSpacing: -0.1, lineHeight: 21 }}
                          >
                            {word}
                          </Text>
                        )
                      }

                      return (
                        <Text
                          key={`${word}-${String(index)}`}
                          fontSize={14}
                          weight="light"
                          style={{
                            color: isValidWord ? theme.primaryText : theme.errorText,
                            textDecorationLine: isValidWord ? 'none' : 'underline'
                          }}
                        >
                          {word}
                        </Text>
                      )
                    })}
                  </View>
                )

                return (
                  <View style={styles.textAreaWrapper}>
                    {styledOverlay}
                    {words.length}
                    <TextArea
                      testID="enter-seed-phrase-field"
                      value={value}
                      editable
                      multiline
                      numberOfLines={4}
                      autoFocus
                      onChangeText={onChange}
                      onBlur={onBlur}
                      inputWrapperStyle={{
                        position: 'relative',
                        backgroundColor: 'transparent',
                        borderColor: theme.neutral600,
                        zIndex: 2,
                        maxHeight: 150
                      }}
                      style={{ fontSize: 20 }}
                      placeholder={t('Write or paste your recovery phrase')}
                      isValid={seedPhraseStatus === 'valid'}
                      error={seedPhraseStatus === 'invalid' && t('Invalid recovery phrase.')}
                      placeholderTextColor={theme.secondaryText}
                      onSubmitEditing={handleFormSubmit}
                      nativeInputStyle={{
                        color: 'rgba(0, 0, 0, 0)',
                        // @ts-ignore caretColor: theme.primaryText
                        caretColor: theme.primaryText,
                        fontSize: 14,
                        padding: 0,
                        border: 0
                      }}
                    />
                  </View>
                )
              }}
            />
            <FatToggle
              testID="enable-passphrase-toggle"
              isOn={enablePassphrase}
              onToggle={() => setEnablePassphrase((prev) => !prev)}
              label={t('Advanced mode')}
              width={44}
              height={22}
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
          </ScrollableWrapper>
          <View style={spacings.pt}>
            <Button
              testID="import-button"
              size="large"
              text={t('Confirm')}
              hasBottomSpacing={false}
              onPress={handleFormSubmit}
              disabled={!isValid || seedPhraseStatus === 'invalid'}
            />
          </View>
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(SeedPhraseImportScreen)
