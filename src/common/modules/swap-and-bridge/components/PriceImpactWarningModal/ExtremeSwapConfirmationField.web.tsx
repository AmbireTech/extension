import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import { normalizeConfirmationPhraseInput } from '@ambire-common/consts/safeguards/extremeSwapLoss'
import getInputStyles, { INPUT_HEIGHT } from '@common/components/Input/styles'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import common from '@common/styles/utils/common'

type Props = {
  expectedConfirmationPhrase: string
  onValidationChange: (isValid: boolean) => void
}

const ExtremeSwapConfirmationField: FC<Props> = ({
  expectedConfirmationPhrase,
  onValidationChange
}) => {
  const { theme, styles } = useTheme(getInputStyles)
  const { t } = useTranslation()
  const [confirmationPhraseInput, setConfirmationPhraseInput] = useState('')

  const textareaStyle = useMemo(
    () =>
      StyleSheet.flatten([
        common.fullWidth,
        common.borderRadiusPrimary,
        styles.input,
        styles.nativeInput,
        spacings.phSm,
        {
          height: INPUT_HEIGHT,
          minHeight: INPUT_HEIGHT,
          maxHeight: INPUT_HEIGHT,
          paddingTop: SPACING_TY,
          paddingBottom: SPACING_TY,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.primaryBorder,
          backgroundColor: theme.secondaryBackground,
          color: theme.primaryText,
          resize: 'none',
          overflowY: 'auto',
          outline: 'none',
          boxSizing: 'border-box'
        }
      ]) as React.CSSProperties,
    [
      styles.input,
      styles.nativeInput,
      theme.primaryBorder,
      theme.primaryText,
      theme.secondaryBackground
    ]
  )

  useEffect(() => {
    const isValid =
      normalizeConfirmationPhraseInput(confirmationPhraseInput) ===
      normalizeConfirmationPhraseInput(expectedConfirmationPhrase)

    onValidationChange(isValid)
  }, [confirmationPhraseInput, expectedConfirmationPhrase, onValidationChange])

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfirmationPhraseInput(event.target.value)
  }, [])

  return (
    <View style={spacings.mtLg}>
      <Text fontSize={14} weight="medium" appearance="errorText" style={spacings.mbTy}>
        {t('Type this phrase to continue:')}
      </Text>
      <Text fontSize={14} appearance="errorText" style={spacings.mbSm}>
        {expectedConfirmationPhrase}
      </Text>
      <Text appearance="secondaryText" fontSize={14} weight="regular" style={spacings.mbTy}>
        {t('Confirmation phrase')}
      </Text>
      <textarea
        value={confirmationPhraseInput}
        onChange={handleChange}
        placeholder={t('Type the phrase above')}
        rows={2}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        data-testid="extreme-swap-confirmation-input"
        style={textareaStyle}
      />
    </View>
  )
}

export default React.memo(ExtremeSwapConfirmationField)
