import React, { useState } from 'react'
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle
} from 'react-native'

import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import colors from '@common/styles/colors'

import getStyles from './styles'

export interface InputProps extends TextInputProps {
  info?: string | boolean
  // Error message - Active if there is some error message string passed
  error?: string | boolean
  label?: string
  isValid?: boolean
  validLabel?: string
  disabled?: boolean
  containerStyle?: ViewStyle
  inputStyle?: ViewStyle
  inputWrapperStyle?: ViewStyle
  infoTextStyle?: TextStyle
  leftIcon?: () => JSX.Element | JSX.Element
}

const TextArea = ({
  label,
  info,
  error,
  isValid,
  validLabel,
  onBlur = () => {},
  onFocus = () => {},
  disabled,
  containerStyle,
  inputStyle,
  inputWrapperStyle,
  infoTextStyle,
  leftIcon,
  ...rest
}: InputProps) => {
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const { theme, styles } = useTheme(getStyles)

  const handleOnFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true)
    return onFocus(e)
  }
  const handleOnBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false)
    return onBlur(e)
  }

  const borderWrapperStyles = [
    styles.borderWrapper,
    !!error && { borderColor: theme.errorBackground },
    isFocused && { borderColor: theme.infoBackground },
    isValid && { borderColor: theme.successBackground }
  ]

  const inputWrapperStyles = [
    styles.inputWrapper,
    {
      backgroundColor: theme.secondaryBackground,
      borderColor: theme.secondaryBorder
    },
    !!error && { borderColor: theme.errorDecorative },
    isFocused && { borderColor: theme.primary },
    isValid && { borderColor: theme.successDecorative },
    disabled && styles.disabled,
    inputWrapperStyle
  ]

  const inputStyles = [styles.input, inputStyle]

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {!!label && (
        <Text fontSize={12} weight="regular" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={borderWrapperStyles}>
        <View style={inputWrapperStyles}>
          {!!leftIcon && <View style={styles.leftIcon}>{leftIcon()}</View>}
          {/* TextInput doesn't support border styles so we wrap it in a View */}
          <View style={inputStyles}>
            <TextInput
              placeholderTextColor={theme.secondaryText}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!disabled}
              onBlur={handleOnBlur}
              onFocus={handleOnFocus}
              {...rest}
              // @ts-ignore outline: 'none'
              style={{ ...styles.nativeInput, outline: 'none' }}
            />
          </View>
        </View>
      </View>
      {!!error && (
        <Text
          style={styles.errorText}
          weight={isWeb ? 'regular' : undefined}
          fontSize={10}
          appearance="errorText"
        >
          {error}
        </Text>
      )}

      {!!isValid && !!validLabel && !error && (
        <Text style={[styles.validText]} weight="regular" fontSize={12} color={colors.greenHaze}>
          {validLabel}
        </Text>
      )}

      {!!info && (
        <Text weight="regular" style={[styles.infoText, infoTextStyle]} fontSize={12}>
          {info}
        </Text>
      )}
    </View>
  )
}

export default React.memo(TextArea)
