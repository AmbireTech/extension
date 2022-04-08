import React, { useState } from 'react'
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  TouchableOpacity,
  View
} from 'react-native'

import Text from '@modules/common/components/Text'
import { colorPalette as colors } from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import textStyles from '@modules/common/styles/utils/text'

import styles from './styles'

export interface InputProps extends TextInputProps {
  info?: string
  // Error message - Active if there is some error message string passed
  error?: string
  label?: string
  isValid?: boolean
  buttonText?: string | JSX.Element
  onButtonPress?: () => void
  disabled?: boolean
  containerStyle?: any
}

const Input = ({
  label,
  buttonText,
  info,
  error,
  isValid,
  onBlur = () => {},
  onFocus = () => {},
  onButtonPress = () => {},
  disabled,
  containerStyle,
  ...rest
}: InputProps) => {
  const [isFocused, setIsFocused] = useState<boolean>(false)

  const handleOnFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true)
    return onFocus(e)
  }
  const handleOnBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false)
    return onBlur(e)
  }

  const hasButton = !!buttonText

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.focused,
          disabled && styles.disabled,
          !!error && styles.error,
          isValid && styles.valid
        ]}
      >
        <TextInput
          placeholderTextColor={colors.waikawaGray}
          style={[styles.input, hasButton && spacings.pr0]}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
          onBlur={handleOnBlur}
          onFocus={handleOnFocus}
          {...rest}
        />
        {hasButton && (
          <TouchableOpacity onPress={onButtonPress} disabled={disabled} style={styles.button}>
            {typeof buttonText === 'string' || buttonText instanceof String ? (
              <Text style={textStyles.bold}>{buttonText}</Text>
            ) : (
              buttonText
            )}
          </TouchableOpacity>
        )}
      </View>

      {!!error && (
        <Text style={styles.errorText} fontSize={12} appearance="danger">
          {error}
        </Text>
      )}

      {!!info && (
        <Text style={styles.infoText} fontSize={12}>
          {info}
        </Text>
      )}
    </View>
  )
}

export default Input
