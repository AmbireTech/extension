import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { getStringAsync } from '@common/utils/clipboard'

import getStyles from './styles'

/** The mobile invite codes are 12 characters long, displayed in two groups of six. */
export const INVITE_CODE_LENGTH = 12

const GROUP_LENGTH = INVITE_CODE_LENGTH / 2

// Codes could be copied around with separators in them, so make pasting forgiving,
// depending on how we visually ship them to the users in the diff invite code distr channels.
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
  const { t } = useTranslation()
  const { addToast } = useToast()
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

  // Long-pressing the cells to reach the OS paste menu is fiddly, so offer an
  // explicit paste button - most people arrive here with the code copied.
  const handlePaste = useCallback(async () => {
    try {
      const sanitized = sanitize(await getStringAsync())

      if (!sanitized) {
        addToast(t('There is no invite code copied on your device.'), { type: 'error' })
        return
      }

      onChange(sanitized)
      focusInput()
    } catch {
      addToast(t('Pasting the invite code failed. Please type it in instead.'), { type: 'error' })
    }
  }, [addToast, focusInput, onChange, t])

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text fontSize={14} appearance="secondaryText">
          {t('Invite code')}
        </Text>
        {!!editable && (
          <Text
            testID="paste-invite-code-btn"
            fontSize={14}
            appearance="primaryText"
            weight="medium"
            underline
            onPress={handlePaste}
          >
            {t('Paste')}
          </Text>
        )}
      </View>
      <Pressable onPress={focusInput}>
        <View style={styles.cells}>
          {cells.map(({ key, char, isActive }, index) => (
            <React.Fragment key={key}>
              {index === GROUP_LENGTH && <View style={styles.separator} />}
              <View
                style={[
                  styles.cell,
                  { borderColor: isActive ? theme.primary : theme.secondaryBorder }
                ]}
              >
                <Text fontSize={18} weight="medium" numberOfLines={1}>
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
    </View>
  )
}

export default React.memo(InviteCodeInput)
