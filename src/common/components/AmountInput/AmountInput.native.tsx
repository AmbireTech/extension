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
import { isAndroid } from '@common/config/env'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { AmountInputProps } from './AmountInput'
import styles, { CARET_ROOM, SINGLE_ROW_AMOUNT_WIDTH } from './styles'

const AmountInput = ({
  type,
  value,
  onChangeText,
  disabled,
  inputTestId,
  fontSize = 24,
  inputWrapperStyle,
  backgroundColor,
  leftIcon,
  leftIconStyle,
  textAlign,
  onBlur: onBlurProp,
  ...rest
}: AmountInputProps) => {
  const { theme } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const [valueWidth, setValueWidth] = useState(0)
  const inputRef = useRef<TextInput>(null)

  const hasCustomLayout = !!(leftIcon || inputWrapperStyle)
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
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd, flexbox.flex1]}>
        <NumberInput
          setInputRef={setInputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder="0"
          borderless
          inputWrapperStyle={[
            { backgroundColor: backgroundColor || 'transparent' },
            inputWrapperStyle || {}
          ]}
          nativeInputStyle={{
            ...fontStyle,
            textAlign: textAlign ?? (isFocused ? 'right' : 'left'),
            color: theme.primaryText
          }}
          disabled={disabled}
          containerStyle={[spacings.mb0 as ViewStyle, { overflow: 'hidden' }, flexbox.flex1]}
          inputStyle={spacings.ph0}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false)
            onBlurProp?.(e)
          }}
          leftIcon={leftIcon}
          leftIconStyle={leftIconStyle}
          selection={
            isAndroid
              ? isFocused
                ? { start: value?.length || 0, end: value?.length || 0 }
                : { start: 0, end: 0 }
              : undefined
          }
          testID={inputTestId}
          {...rest}
        />
      </View>
    )

  // A bare amount: the input is exactly as wide as its value, so the `$` always sits right before
  // it, and the pair lines up at the end of the space it is given, all of which focuses the input
  return (
    <Pressable
      style={styles.container}
      onPress={focusInput}
      disabled={disabled}
      // The input inside is what screen readers should land on
      accessible={false}
    >
      <View style={styles.measure} pointerEvents="none">
        <RNText style={[fontStyle, styles.measuredValue]} onLayout={handleValueLayout}>
          {value || '0'}
        </RNText>
      </View>
      {/* Centred as is - the web's 1px lift (styles.fiatSign) puts it 1pt high. Above the input (whose
          container is at zIndex 10), on the panel's background, to cover a too long value's digits */}
      {type === 'fiat' && (
        <Text
          fontSize={fontSize}
          weight="medium"
          appearance="secondaryText"
          style={{ zIndex: 11, backgroundColor: theme.secondaryBackground }}
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
        nativeInputStyle={{
          ...fontStyle,
          color: theme.primaryText,
          // A width-constrained input wraps a long value onto a second row on iOS, so it gets room
          // for any amount. While typing it grows leftwards, so a new digit lands in place at once
          textAlign: isFocused ? 'right' : 'left',
          width: SINGLE_ROW_AMOUNT_WIDTH,
          paddingRight: isFocused ? CARET_ROOM : 0
        }}
        disabled={disabled}
        // Unclipped, so a digit typed before the box is re-measured still shows; the field clips
        containerStyle={[
          styles.inputContainer,
          { width: valueWidth + CARET_ROOM, overflow: 'visible' }
        ]}
        inputStyle={{ paddingHorizontal: 0, alignItems: isFocused ? 'flex-end' : 'flex-start' }}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false)
          onBlurProp?.(e)
        }}
        testID={inputTestId}
        {...rest}
      />
    </Pressable>
  )
}

export default React.memo(AmountInput)
