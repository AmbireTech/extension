import React, { useRef, useState } from 'react'
import { Pressable, TextInput, View, ViewStyle } from 'react-native'

import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { isAndroid, isMobile } from '@common/config/env'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { AmountInputProps } from './AmountInput'

const AmountInput = ({
  type,
  value,
  onChangeText,
  disabled,
  inputTestId,
  fontSize = 24
}: AmountInputProps) => {
  const { theme } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifyEnd,
        flexbox.flex1,
        isMobile && { maxWidth: '40%' }
      ]}
    >
      <Pressable
        style={[flexbox.flex1, { height: 28 }]}
        onPress={() => inputRef.current?.focus()}
      />
      {type === 'fiat' && (
        <Pressable
          style={{ transform: [{ translateY: -1 }] }}
          onPress={() => inputRef.current?.focus()}
        >
          <Text fontSize={fontSize} weight="medium" appearance="secondaryText">
            $
          </Text>
        </Pressable>
      )}
      <NumberInput
        setInputRef={(r) => {
          inputRef.current = r
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        borderless
        inputWrapperStyle={{ backgroundColor: 'transparent' }}
        nativeInputStyle={{
          fontFamily: FONT_FAMILIES.MEDIUM,
          fontSize: fontSize,
          textAlign: isFocused ? 'right' : 'left',
          color: theme.primaryText
        }}
        disabled={disabled}
        containerStyle={[
          spacings.mb0 as ViewStyle,
          { overflow: 'hidden', maxWidth: '90%' },
          { flex: 0 }
        ]}
        inputStyle={{ ...spacings.ph0, flex: 0 }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        selection={
          isAndroid
            ? isFocused
              ? { start: value?.length || 0, end: value?.length || 0 }
              : { start: 0, end: 0 }
            : undefined
        }
        testID={inputTestId}
      />
    </View>
  )
}

export default React.memo(AmountInput)
