import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { TextInput, View } from 'react-native'

import Text from '@common/components/Text'
import TextArea from '@common/components/TextArea'
import { useTranslation } from '@common/config/localization'
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
 * Data attribute used to style the selection of the native input in `style.css`
 */
const SELECTION_DATA_SET = { seedPhraseInput: 'true' }

/**
 * Lets the user type their recovery phrase and underlines the words that are not
 * valid recovery phrase words. The typed text itself is transparent and a backdrop
 * with the same typography, rendered behind it, displays the colored words.
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
  const nativeInputRef = useRef<TextInput>(null)
  const backdropRef = useRef<View>(null)

  const tokens = useMemo(() => getSeedPhraseTokens(value, caretPosition), [value, caretPosition])

  const updateCaretPosition = useCallback(() => {
    const nativeInput = nativeInputRef.current as unknown as HTMLTextAreaElement | null
    if (!nativeInput) return

    onCaretPositionChange(nativeInput.selectionEnd)
  }, [onCaretPositionChange])

  // Caret moves (clicks, arrow keys) don't trigger `onSelectionChange` on web,
  // because it relies on the `select` event, which fires only for text selections.
  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement !== (nativeInputRef.current as unknown as Element)) return

      updateCaretPosition()
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [updateCaretPosition])

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text)
      // Updated in the same event as the value, so the word being typed is never
      // validated against a stale caret position
      updateCaretPosition()
    },
    [onChangeText, updateCaretPosition]
  )

  const handleBlur = useCallback(() => {
    onCaretPositionChange(null)
    onBlur()
  }, [onCaretPositionChange, onBlur])

  // The text in the native input may overflow and become scrollable,
  // so the backdrop must follow its scroll position.
  const syncBackdropScroll = useCallback(() => {
    const nativeInput = nativeInputRef.current as unknown as HTMLElement | null
    const backdrop = backdropRef.current as unknown as HTMLElement | null
    if (!nativeInput || !backdrop) return

    backdrop.scrollTop = nativeInput.scrollTop
  }, [])

  // Scroll events don't fire for every change of the content (e.g. when the
  // backdrop grows after the native input has already scrolled), so sync after each render too
  useLayoutEffect(syncBackdropScroll, [tokens, syncBackdropScroll])

  const backdrop = useMemo(
    () => (
      <View ref={backdropRef} style={styles.backdrop} pointerEvents="none" aria-hidden>
        <Text fontSize={14} style={styles.backdropText}>
          {tokens.map((token) => (
            <Text
              key={token.startIndex}
              fontSize={14}
              color={token.isInvalidWord ? theme.errorText : theme.primaryText}
              underline={token.isInvalidWord}
            >
              {token.value}
            </Text>
          ))}
          {/* Keeps a trailing new line visible, like in the native input */}
          {value.endsWith('\n') && '​'}
        </Text>
      </View>
    ),
    [tokens, value, styles, theme]
  )

  const nativeInputStyle = useMemo(
    () => ({
      ...styles.nativeInput,
      color: 'transparent',
      caretColor: theme.primaryText
    }),
    [styles.nativeInput, theme.primaryText]
  )

  const inputWrapperStyle = useMemo(
    () => ({ backgroundColor: 'transparent', borderColor: theme.neutral600 }),
    [theme.neutral600]
  )

  return (
    <TextArea
      ref={nativeInputRef}
      testID="enter-seed-phrase-field"
      dataSet={SELECTION_DATA_SET}
      value={value}
      editable
      multiline
      numberOfLines={4}
      autoFocus
      spellCheck={false}
      onChangeText={handleChangeText}
      onFocus={updateCaretPosition}
      onBlur={handleBlur}
      onScroll={syncBackdropScroll}
      customInputContent={backdrop}
      inputStyle={styles.inputBox}
      inputWrapperStyle={inputWrapperStyle}
      nativeInputStyle={nativeInputStyle}
      placeholder={t('Write or paste your recovery phrase')}
      placeholderTextColor={theme.secondaryText}
      isValid={status === 'valid'}
      error={error}
      onSubmitEditing={onSubmitEditing}
    />
  )
}

export default React.memo(SeedPhraseInput)
