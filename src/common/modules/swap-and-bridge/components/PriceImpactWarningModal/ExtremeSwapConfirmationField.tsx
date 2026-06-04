import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { normalizeConfirmationPhraseInput } from '@ambire-common/libs/safeguards/extremeSwapLoss'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

type Props = {
  expectedConfirmationPhrase: string
  onValidationChange: (isValid: boolean) => void
}

const ExtremeSwapConfirmationField: FC<Props> = ({
  expectedConfirmationPhrase,
  onValidationChange
}) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [confirmationPhraseInput, setConfirmationPhraseInput] = useState('')

  const inputWrapperStyle = useMemo(
    () => ({
      borderWidth: 1,
      borderColor: theme.primaryBorder
    }),
    [theme.primaryBorder]
  )

  useEffect(() => {
    const isValid =
      normalizeConfirmationPhraseInput(confirmationPhraseInput) ===
      normalizeConfirmationPhraseInput(expectedConfirmationPhrase)

    onValidationChange(isValid)
  }, [confirmationPhraseInput, expectedConfirmationPhrase, onValidationChange])

  const handleConfirmationPhraseChange = useCallback((text: string) => {
    setConfirmationPhraseInput(text)
  }, [])

  return (
    <View style={spacings.mtLg}>
      <Text fontSize={14} weight="medium" appearance="errorText" style={spacings.mbTy}>
        {t('Type "{{phrase}}" to proceed:', { phrase: expectedConfirmationPhrase })}
      </Text>
      <Input
        value={confirmationPhraseInput}
        onChangeText={handleConfirmationPhraseChange}
        placeholder={t('Type "{{phrase}}" to proceed', { phrase: expectedConfirmationPhrase })}
        autoCapitalize="characters"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        backgroundColor={theme.secondaryBackground}
        inputWrapperStyle={inputWrapperStyle}
        preventJumpOnValidationChange
        testID="extreme-swap-confirmation-input"
      />
    </View>
  )
}

export default React.memo(ExtremeSwapConfirmationField)
