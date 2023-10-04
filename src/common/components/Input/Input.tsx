import React, { useState } from 'react'
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps
} from 'react-native'

import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'

import styles from './styles'

export interface InputProps extends TextInputProps {
  info?: string | boolean
  // Error message - Active if there is some error message string passed
  error?: string | boolean
  label?: string
  isValid?: boolean
  validLabel?: string
  button?: string | JSX.Element | null
  buttonProps?: TouchableOpacityProps
  onButtonPress?: () => void
  disabled?: boolean
  containerStyle?: any
  inputStyle?: any
  inputWrapperStyle?: any
  inputBackgroundStyle?: ViewProps['style']
  infoTextStyle?: any
  leftIcon?: () => JSX.Element | JSX.Element
}

const Input = ({
  label,
  button,
  buttonProps,
  info,
  error,
  isValid,
  validLabel,
  onBlur = () => {},
  onFocus = () => {},
  onButtonPress = () => {},
  disabled,
  containerStyle,
  inputStyle,
  inputWrapperStyle,
  inputBackgroundStyle = {},
  infoTextStyle,
  leftIcon,
  ...rest
}: InputProps) => {
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const { theme } = useTheme()

  const handleOnFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true)
    return onFocus(e)
  }
  const handleOnBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false)
    return onBlur(e)
  }

  const hasButton = !!button

  const inputWrapperStyles = [
    styles.inputWrapper,
    {
      backgroundColor: theme.inputBackground,
      borderBottomColor: theme.inputBorder
    },
    !!error && { borderBottomColor: theme.inputBorderInvalid },
    isFocused && { borderBottomColor: theme.inputBorderFocused },
    isValid && { borderBottomColor: theme.inputBorderValid },
    disabled && styles.disabled,
    inputWrapperStyle
  ]

  const inputStyles = [
    styles.input,
    !!hasButton && spacings.pr0,
    {
      color: theme.buttonText
    },
    inputStyle
  ]

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[commonStyles.borderRadiusPrimary, commonStyles.hidden, inputBackgroundStyle]}>
        <View style={inputWrapperStyles}>
          {!!leftIcon && <View style={styles.leftIcon}>{leftIcon()}</View>}
          <TextInput
            placeholderTextColor={theme.buttonPlaceholderText}
            style={inputStyles}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!disabled}
            onBlur={handleOnBlur}
            onFocus={handleOnFocus}
            {...rest}
          />
          {!!hasButton && (
            <TouchableOpacity
              // The `focusable` prop determines whether a component is user-focusable
              // and appears in the keyboard tab flow. It's missing in the
              // TouchableOpacity props, because it's react-native-web specific, see:
              // {@link https://necolas.github.io/react-native-web/docs/accessibility/#keyboard-focus}
              // @ts-ignore-next-line
              focusable={false}
              onPress={onButtonPress}
              disabled={disabled}
              style={styles.button}
              {...buttonProps}
            >
              {typeof button === 'string' || button instanceof String ? (
                <Text weight="medium">{button}</Text>
              ) : (
                button
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!!error && (
        <Text
          style={styles.errorText}
          weight={isWeb ? 'regular' : undefined}
          fontSize={12}
          appearance="danger"
        >
          {error}
        </Text>
      )}

      {!!isValid && !!validLabel && !error && (
        <Text style={[styles.validText]} fontSize={12} color={colors.turquoise}>
          {validLabel}
        </Text>
      )}

      {!!info && (
        <Text style={[styles.infoText, infoTextStyle]} fontSize={12}>
          {info}
        </Text>
      )}
    </View>
  )
}

export default React.memo(Input)
