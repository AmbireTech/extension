import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

/** The mobile invite codes are 12 characters long, displayed in two groups of six. */
export const INVITE_CODE_LENGTH = 12

const GROUP_LENGTH = INVITE_CODE_LENGTH / 2

// Codes are copied around with separators in them, so make pasting forgiving.
const SEPARATORS = [' ', '-', '_']

const sanitize = (raw: string) =>
  raw
    .split('')
    .filter((char) => !SEPARATORS.includes(char))
    .slice(0, INVITE_CODE_LENGTH)
    .join('')

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmitEditing: () => void
  editable?: boolean
}

const InviteCodeInput = ({ value, onChange, onSubmitEditing, editable = true }: Props) => {
  const { styles, theme } = useTheme(getStyles)
  const inputRef = useRef<TextInput>(null)
  const [isFocused, setIsFocused] = useState(false)

  const handleChangeText = useCallback(
    (nextValue: string) => onChange(sanitize(nextValue)),
    [onChange]
  )

  const focusInput = useCallback(() => inputRef.current?.focus(), [])

  const handleFocus = useCallback(() => setIsFocused(true), [])
  const handleBlur = useCallback(() => setIsFocused(false), [])

  const cells = useMemo(
    () =>
      Array.from({ length: INVITE_CODE_LENGTH }, (_, index) => ({
        // The index is a stable key here - the cells are a fixed-length, never reordered grid.
        key: `invite-code-cell-${index}`,
        char: value[index] ?? '',
        isActive: isFocused && index === Math.min(value.length, INVITE_CODE_LENGTH - 1)
      })),
    [value, isFocused]
  )

  return (
    <Pressable onPress={focusInput} style={styles.container}>
      <View style={styles.cells}>
        {cells.map(({ key, char, isActive }, index) => (
          <React.Fragment key={key}>
            {index === GROUP_LENGTH && <View style={styles.separator} />}
            <View
              style={[
                styles.cell,
                { borderBottomColor: isActive ? theme.primary : theme.secondaryBorder }
              ]}
            >
              <Text fontSize={20} weight="medium" numberOfLines={1}>
                {char}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
      <TextInput
        testID="invite-code-input"
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmitEditing}
        editable={editable}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        caretHidden
        returnKeyType="done"
      />
    </Pressable>
  )
}

export default React.memo(InviteCodeInput)
