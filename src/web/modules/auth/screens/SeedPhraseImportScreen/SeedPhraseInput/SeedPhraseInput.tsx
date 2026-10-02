import React, { useCallback, useMemo, useRef } from 'react'
import { NativeSyntheticEvent, TextInputScrollEventData, View } from 'react-native'

import Text from '@common/components/Text'
import TextArea from '@common/components/TextArea'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { getSeedPhraseTokens, SeedPhraseStatus } from '@common/modules/auth/utils/seedPhrase'

import getStyles from './styles'

type Props = {
  value: string
  status: SeedPhraseStatus
  onChangeText: (value: string) => void
  onBlur: () => void
  onSubmitEditing: () => void
}

/**
 * Lets the user type their recovery phrase and underlines the words that are not
 * valid recovery phrase words. The typed text itself is transparent and a backdrop
 * with the same typography, rendered behind it, displays the colored words.
 */
const SeedPhraseInput = ({ value, status, onChangeText, onBlur, onSubmitEditing }: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const backdropRef = useRef<View>(null)

  const tokens = useMemo(() => getSeedPhraseTokens(value), [value])

  // The text in the native input may overflow and become scrollable,
  // so the backdrop must follow its scroll position.
  const handleScroll = useCallback((e: NativeSyntheticEvent<TextInputScrollEventData>) => {
    const backdrop = backdropRef.current as unknown as HTMLElement | null
    const nativeInput = e.target as unknown as HTMLElement
    if (!backdrop) return

    backdrop.scrollTop = nativeInput.scrollTop
  }, [])

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
          {'\u200b'}
        </Text>
      </View>
    ),
    [tokens, styles, theme]
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
      testID="enter-seed-phrase-field"
      value={value}
      editable
      multiline
      numberOfLines={4}
      autoFocus
      spellCheck={false}
      onChangeText={onChangeText}
      onBlur={onBlur}
      onScroll={handleScroll}
      customInputContent={backdrop}
      inputStyle={styles.inputBox}
      inputWrapperStyle={inputWrapperStyle}
      nativeInputStyle={nativeInputStyle}
      placeholder={t('Write or paste your recovery phrase')}
      placeholderTextColor={theme.secondaryText}
      isValid={status === 'valid'}
      error={status === 'invalid' && t('Invalid recovery phrase.')}
      onSubmitEditing={onSubmitEditing}
    />
  )
}

export default React.memo(SeedPhraseInput)
