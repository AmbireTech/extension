import React, { useCallback, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  Pressable,
  Text as RNText,
  TextInput,
  View,
  ViewStyle
} from 'react-native'

import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { AmountInputProps } from './AmountInput'
import styles, { CARET_ROOM } from './styles'

const AmountInput = ({
  type,
  value,
  onChangeText,
  disabled,
  inputTestId,
  fontSize = 24,
  inputWrapperStyle,
  backgroundColor,
  ...rest
}: AmountInputProps) => {
  const { theme } = useTheme()
  const [valueWidth, setValueWidth] = useState(0)
  const inputRef = useRef<TextInput>(null)

  const hasCustomLayout = !!(rest.leftIcon || inputWrapperStyle)
  const fontStyle = { fontFamily: FONT_FAMILIES.MEDIUM, fontSize }

  const focusInput = useCallback(() => inputRef.current?.focus(), [])
  const setInputRef = useCallback((r: TextInput | null) => {
    inputRef.current = r
  }, [])
  const handleValueLayout = useCallback(
    (e: LayoutChangeEvent) => setValueWidth(Math.ceil(e.nativeEvent.layout.width)),
    []
  )

  // A field of its own (the approval editor): the input fills it, with its own background and icon
  if (hasCustomLayout)
    return (
      <NumberInput
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        borderless
        inputWrapperStyle={[
          { backgroundColor: backgroundColor || 'transparent' },
          inputWrapperStyle || {}
        ]}
        nativeInputStyle={{ ...fontStyle, textAlign: 'right', color: theme.primaryText }}
        disabled={disabled}
        containerStyle={[spacings.mb0 as ViewStyle, flexbox.flex1, { overflow: 'hidden' }]}
        inputStyle={spacings.ph0}
        testID={inputTestId}
        {...rest}
      />
    )

  // A bare amount: the input is exactly as wide as its value, so the `$` always sits right before
  // it, and the pair lines up at the end of the space it is given, all of which focuses the input.
  // A value wider than that space shrinks the input rather than pushing the `$` out, and the
  // browser scrolls the value to follow the caret. The input inside is what takes the focus.
  return (
    <Pressable style={styles.container} onPress={focusInput} disabled={disabled} focusable={false}>
      <View style={styles.measure} pointerEvents="none">
        <RNText style={[fontStyle, styles.measuredValue]} onLayout={handleValueLayout}>
          {value || '0'}
        </RNText>
      </View>
      {type === 'fiat' && (
        <Text
          fontSize={fontSize}
          weight="medium"
          appearance="secondaryText"
          style={styles.fiatSign}
        >
          $
        </Text>
      )}
      <NumberInput
        setInputRef={setInputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        borderless
        inputWrapperStyle={{ backgroundColor: backgroundColor || 'transparent' }}
        // Against the `$`, with the caret's room after it
        nativeInputStyle={{ ...fontStyle, textAlign: 'left', color: theme.primaryText }}
        disabled={disabled}
        containerStyle={[styles.inputContainer, { width: valueWidth + CARET_ROOM }]}
        inputStyle={spacings.ph0}
        testID={inputTestId}
        {...rest}
      />
    </Pressable>
  )
}

export default React.memo(AmountInput)
