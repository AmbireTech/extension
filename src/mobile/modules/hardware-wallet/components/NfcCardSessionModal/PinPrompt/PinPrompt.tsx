import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, Easing, Pressable, View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { DURATIONS } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles, { KEY_FONT_SIZE } from './styles'

/** Every supported card uses the Keycard applet, which has a fixed 6 digit PIN. */
const PIN_LENGTH = 6

const KEYPAD_ROWS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['0']]

interface KeyProps {
  digit: string
  onPress: (digit: string) => void
}

/**
 * `useHover` is skipped here, because it dims the whole key, digit included. iOS
 * instead brightens only the fill, and it does so the instant the finger lands (so a
 * quickly typed PIN still lights up every key), then fades it back out on release.
 */
const PinKey: React.FC<KeyProps> = ({ digit, onPress }) => {
  const { styles } = useTheme(getStyles)
  const pressProgress = useMemo(() => new Animated.Value(0), [])

  const handlePressIn = useCallback(() => pressProgress.setValue(1), [pressProgress])

  const handlePressOut = useCallback(() => {
    Animated.timing(pressProgress, {
      toValue: 0,
      duration: DURATIONS.SLOW,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start()
  }, [pressProgress])

  return (
    <Pressable
      style={styles.key}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(digit)}
      testID={`nfc-pin-key-${digit}`}
    >
      <Animated.View style={[styles.keyPressHighlight, { opacity: pressProgress }]} />
      <Text fontSize={KEY_FONT_SIZE}>{digit}</Text>
    </Pressable>
  )
}

const MemoizedPinKey = React.memo(PinKey)

interface Props {
  error: string | null
  onSubmit: (pin: string) => void
  onCancel: () => void
}

/**
 * A keypad instead of a text field, so no keyboard covers the sheet and the PIN
 * cannot be picked up by a keyboard app. The PIN has a fixed length, so there is
 * nothing to confirm - the last digit submits it.
 *
 * The typed PIN is kept here instead of in the modal, so typing re-renders only
 * this subtree. Keeping it in the modal re-renders the whole bottom sheet on every
 * keystroke, which makes it lag behind. Unmounting on step change is what wipes
 * the PIN - it is never kept across steps.
 */
const PinPrompt: React.FC<Props> = ({ error, onSubmit, onCancel }) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const [pin, setPin] = useState('')

  const handleKeyPress = useCallback((digit: string) => {
    setPin((prevPin) => (prevPin.length >= PIN_LENGTH ? prevPin : prevPin + digit))
  }, [])

  const handleDelete = useCallback(() => setPin((prevPin) => prevPin.slice(0, -1)), [])

  // Submitted from an effect (not from the key press) so the last dot is painted
  // before the sheet moves on to the tap step.
  useEffect(() => {
    if (pin.length === PIN_LENGTH) onSubmit(pin)
  }, [pin, onSubmit])

  return (
    <View style={spacings.pbLg}>
      <Text
        fontSize={14}
        appearance="secondaryText"
        style={[spacings.mbLg, { textAlign: 'center' }]}
      >
        {t('Your PIN unlocks the card for this one operation only. It is never saved.')}
      </Text>

      <View style={[styles.dots, error ? spacings.mbSm : spacings.mbLg]}>
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <View
            key={`pin-dot-${index}`}
            style={[styles.dot, index < pin.length && styles.dotFilled]}
          />
        ))}
      </View>

      {!!error && (
        <Text fontSize={12} appearance="errorText" style={[spacings.mbLg, { textAlign: 'center' }]}>
          {error}
        </Text>
      )}

      <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row) => (
          <View key={`pin-row-${row[0]}`} style={styles.keypadRow}>
            {row.map((digit) => (
              <MemoizedPinKey key={digit} digit={digit} onPress={handleKeyPress} />
            ))}
          </View>
        ))}
      </View>

      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtLg]}>
        <Button
          type="secondary"
          text={t('Cancel')}
          onPress={onCancel}
          hasBottomSpacing={false}
          style={[flexbox.flex1, spacings.mrSm]}
        />
        <Button
          type="secondary"
          text={t('Delete')}
          onPress={handleDelete}
          disabled={!pin}
          hasBottomSpacing={false}
          style={flexbox.flex1}
        />
      </View>
    </View>
  )
}

export default React.memo(PinPrompt)
