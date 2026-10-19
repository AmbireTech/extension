import React, { ReactNode, useState } from 'react'
import { BlurEvent, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useAutoFocus from '@common/hooks/useAutoFocus'
import useTextInputRemountKey from '@common/hooks/useTextInputRemountKey'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

export interface InputProps extends TextInputProps {
  info?: string | boolean
  // Error message - Active if there is some error message string passed
  error?: string | boolean
  label?: string
  isValid?: boolean
  validLabel?: string
  disabled?: boolean
  containerStyle?: ViewStyle | ViewStyle[]
  inputStyle?: ViewStyle | ViewStyle[]
  inputWrapperStyle?: ViewStyle | ViewStyle[]
  bottomLabelStyle?: TextStyle | TextStyle[]
  nativeInputStyle?: TextStyle
  leftIcon?: () => ReactNode
  /**
   * Rendered inside the input box, right before the native input. Useful for
   * absolutely positioned layers that should match the native input's box.
   */
  customInputContent?: ReactNode
  /**
   * Receives the native input, also when its `autoFocus` is deferred
   */
  setInputRef?: (ref: TextInput | null) => void
  /**
   * Rendered as `data-*` attributes of the native input on web
   */
  dataSet?: { [key: string]: string }
  value?: string
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
  bottomLabelStyle,
  nativeInputStyle,
  leftIcon,
  customInputContent,
  value,
  autoFocus,
  style,
  setInputRef,
  ...rest
}: InputProps) => {
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const { theme, styles } = useTheme(getStyles)
  const { autoFocus: nativeAutoFocus, setInputRef: setAutoFocusInputRef } = useAutoFocus(
    autoFocus,
    setInputRef
  )
  const textInputRemountKey = useTextInputRemountKey(value, isFocused)

  const handleOnFocus = (e: BlurEvent) => {
    setIsFocused(true)
    return onFocus(e)
  }
  const handleOnBlur = (e: BlurEvent) => {
    setIsFocused(false)
    return onBlur(e)
  }

  const inputWrapperStyles = [
    styles.inputWrapper,
    {
      backgroundColor: theme.secondaryBackground,
      borderColor: theme.secondaryBorder
    },
    isValid && { borderColor: theme.successDecorative },
    !!error && { borderColor: theme.errorDecorative },
    disabled && styles.disabled,
    inputWrapperStyle
  ]

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {!!label && (
        <Text fontSize={12} weight="regular" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={inputWrapperStyles}>
        {!!leftIcon && <View style={styles.leftIcon}>{leftIcon()}</View>}
        {/* TextInput doesn't support border styles so we wrap it in a View */}
        <View style={[styles.input, { height: '100%' }, inputStyle]}>
          {customInputContent}
          <TextInput
            key={textInputRemountKey}
            placeholderTextColor={theme.secondaryText}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!disabled}
            onBlur={handleOnBlur}
            onFocus={handleOnFocus}
            ref={setAutoFocusInputRef}
            autoFocus={nativeAutoFocus}
            value={value}
            {...rest}
            style={[
              { textAlignVertical: 'top' },
              styles.nativeInput,
              // @ts-ignore outline: 'none'
              { outline: 'none' },
              style,
              nativeInputStyle
            ]}
          />
        </View>
      </View>
      {!!error && (
        <Text
          style={[styles.bottomLabel, bottomLabelStyle]}
          weight={isWeb ? 'regular' : undefined}
          fontSize={10}
          appearance="errorText"
        >
          {error}
        </Text>
      )}

      {!!isValid && !!validLabel && !error && (
        <Text
          style={[styles.bottomLabel, bottomLabelStyle]}
          weight="regular"
          fontSize={12}
          color={theme.successText}
        >
          {validLabel}
        </Text>
      )}

      {!!info && (
        <Text weight="regular" style={[styles.bottomLabel, bottomLabelStyle]} fontSize={12}>
          {info}
        </Text>
      )}
    </View>
  )
}

export default React.memo(TextArea)
