import React, { useCallback, useMemo } from 'react'
import { NativeSyntheticEvent, TextInputSelectionChangeEventData } from 'react-native'

import Text from '@common/components/Text'
import TextArea from '@common/components/TextArea'
import { useTranslation } from '@common/config/localization'
import { NO_KEYBOARD_LEARNING_PROPS } from '@common/constants/textInput'
import useTheme from '@common/hooks/useTheme'
import { getSeedPhraseTokens, SeedPhraseStatus } from '@common/modules/auth/utils/seedPhrase'

import getStyles from './styles'

type Props = {
  value: string
  status: SeedPhraseStatus
  error?: string
  /**
   * `null` while the input is not focused
   */
  caretPosition: number | null
  onChangeText: (value: string) => void
  onCaretPositionChange: (caretPosition: number | null) => void
  onBlur: () => void
  onSubmitEditing: () => void
}

/**
 * Lets the user type their recovery phrase and underlines the words that are not
 * valid recovery phrase words. The colored words are rendered as children of the
 * native input (instead of `value`), so they are always aligned with the typed text.
 */
const SeedPhraseInput = ({
  value,
  status,
  error,
  caretPosition,
  onChangeText,
  onCaretPositionChange,
  onBlur,
  onSubmitEditing
}: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)

  const tokens = useMemo(() => getSeedPhraseTokens(value, caretPosition), [value, caretPosition])

  // The caret is at the end when focusing; `onSelectionChange` corrects it right after
  // if the user tapped somewhere else in the text
  const handleFocus = useCallback(
    () => onCaretPositionChange(value.length),
    [onCaretPositionChange, value.length]
  )

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) =>
      onCaretPositionChange(e.nativeEvent.selection.end),
    [onCaretPositionChange]
  )

  const handleBlur = useCallback(() => {
    onCaretPositionChange(null)
    onBlur()
  }, [onCaretPositionChange, onBlur])

  const inputWrapperStyle = useMemo(
    () => [styles.inputWrapper, { borderColor: theme.neutral600 }],
    [styles.inputWrapper, theme.neutral600]
  )

  return (
    <TextArea
      {...NO_KEYBOARD_LEARNING_PROPS}
      testID="enter-seed-phrase-field"
      editable
      multiline
      numberOfLines={4}
      autoFocus
      // Together with `NO_KEYBOARD_LEARNING_PROPS`, keeps the recovery phrase away from
      // the keyboard's suggestions, learned words and autofill
      textContentType="none"
      onChangeText={onChangeText}
      onFocus={handleFocus}
      onSelectionChange={handleSelectionChange}
      onBlur={handleBlur}
      inputWrapperStyle={inputWrapperStyle}
      nativeInputStyle={styles.nativeInput}
      placeholder={t('Write or paste your recovery phrase')}
      placeholderTextColor={theme.secondaryText}
      isValid={status === 'valid'}
      error={error}
      onSubmitEditing={onSubmitEditing}
    >
      {tokens.map((token) => (
        <Text
          key={token.startIndex}
          fontSize={14}
          weight="light"
          color={token.isInvalidWord ? theme.errorText : theme.primaryText}
          underline={token.isInvalidWord}
        >
          {token.value}
        </Text>
      ))}
    </TextArea>
  )
}

export default React.memo(SeedPhraseInput)
