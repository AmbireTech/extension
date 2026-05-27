import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import { normalizeConfirmationPhraseInput } from '@ambire-common/consts/safeguards/extremeSwapLoss'
import getInputStyles, { INPUT_HEIGHT } from '@common/components/Input/styles'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import common from '@common/styles/utils/common'

const INPUT_FONT_SIZE = 14
const INPUT_LINE_HEIGHT = 20
const INPUT_BORDER_WIDTH = 1
const INPUT_VERTICAL_PADDING = (INPUT_HEIGHT - INPUT_LINE_HEIGHT - INPUT_BORDER_WIDTH * 2) / 2

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

  const inputStyle = useMemo(
    () =>
      ({
        ...StyleSheet.flatten([
          common.fullWidth,
          common.borderRadiusPrimary,
          styles.input,
          styles.nativeInput
        ]),
        height: INPUT_HEIGHT,
        fontSize: INPUT_FONT_SIZE,
        lineHeight: `${INPUT_LINE_HEIGHT}px`,
        paddingTop: INPUT_VERTICAL_PADDING,
        paddingBottom: INPUT_VERTICAL_PADDING,
        paddingLeft: SPACING_SM,
        paddingRight: SPACING_SM,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: theme.primaryBorder,
        backgroundColor: theme.secondaryBackground,
        color: theme.primaryText,
        outline: 'none',
        boxSizing: 'border-box'
      }) as React.CSSProperties,
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

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
      <input
        type="text"
        value={confirmationPhraseInput}
        onChange={handleChange}
        placeholder={t('Type the phrase above')}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        data-testid="extreme-swap-confirmation-input"
        style={inputStyle}
      />
    </View>
  )
}

export default React.memo(ExtremeSwapConfirmationField)
