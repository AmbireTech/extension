import React, { ReactNode, useState } from 'react'
import {
  BlurEvent,
  ColorValue,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacityProps,
  View,
  ViewStyle
} from 'react-native'

import InformationIcon from '@common/assets/svg/InformationIcon'
import Text, { TextAppearance } from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'

import getStyles from './styles'

export interface InputProps extends TextInputProps {
  info?: string | boolean
  // Error message - Active if there is some error message string passed
  error?: string | boolean
  errorType?: 'error' | 'warning'
  label?: string
  isValid?: boolean
  validLabel?: string
  validLabelAppearance?: TextAppearance
  button?: string | ReactNode | null
  buttonProps?: TouchableOpacityProps & {
    withBackground?: boolean
  }
  buttonStyle?: ViewStyle
  onButtonPress?: () => void
  disabled?: boolean
  containerStyle?: ViewStyle | ViewStyle[]
  inputStyle?: ViewStyle | ViewStyle[]
  setInputRef?: (ref: TextInput | null) => void
  inputBorderWrapperRef?: React.RefObject<View>
  nativeInputStyle?: ViewStyle & TextStyle
  inputWrapperStyle?: ViewStyle | ViewStyle[]
  bottomLabelStyle?: TextStyle | TextStyle[]
  leftIcon?: () => ReactNode
  leftIconStyle?: ViewStyle
  tooltip?: {
    id: string
    content: string
  }
  backgroundColor?: ColorValue
  childrenBeforeButtons?: ReactNode
  childrenBelowInput?: ReactNode
  borderless?: boolean
  customInputContent?: ReactNode
  renderConfirmAddress?: () => ReactNode
  preventJumpOnValidationChange?: boolean
}

const Input = ({
  label,
  button,
  buttonProps,
  buttonStyle,
  info,
  error,
  errorType,
  isValid,
  validLabel,
  validLabelAppearance,
  onBlur = () => {},
  onFocus = () => {},
  onButtonPress = () => {},
  disabled,
  containerStyle,
  inputStyle,
  nativeInputStyle,
  inputWrapperStyle,
  bottomLabelStyle,
  leftIcon,
  leftIconStyle,
  childrenBeforeButtons,
  childrenBelowInput,
  tooltip,
  borderless,
  setInputRef,
  inputBorderWrapperRef,
  customInputContent,
  editable,
  backgroundColor,
  renderConfirmAddress,
  preventJumpOnValidationChange,
  ...rest
}: InputProps) => {
  const { theme, styles } = useTheme(getStyles)
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })
  const [isFocused, setIsFocused] = useState(false)

  const handleOnFocus = (e: BlurEvent) => {
    if (disabled) return
    setIsFocused(true)

    return onFocus(e)
  }
  const handleOnBlur = (e: BlurEvent) => {
    if (disabled) return
    setIsFocused(false)
    return onBlur(e)
  }

  const hasButton = !!button

  const inputWrapperStyles: ViewStyle[] = [
    styles.inputWrapper,
    {
      backgroundColor: backgroundColor || theme.primaryBackground,
      borderColor: 'transparent'
    },
    isValid ? { borderColor: theme.successDecorative } : {},
    isFocused ? { backgroundColor: theme.tertiaryBackground } : {},
    error ? { borderColor: theme.errorDecorative } : {},
    info ? { borderColor: theme.warningText } : {},
    disabled ? styles.disabled : {},
    borderless ? { borderColor: 'transparent', borderWidth: 0 } : {},
    ...(Array.isArray(inputWrapperStyle) ? inputWrapperStyle : [inputWrapperStyle || {}])
  ]

  const inputStyles = [styles.input, !!hasButton && spacings.pr0, inputStyle]

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {!!label && (
        <Text appearance="secondaryText" fontSize={14} weight="regular" style={styles.label}>
          {label}
          {!!tooltip && (
            <View style={{ width: 1 }}>
              <View style={{ position: 'absolute', top: -11.5, left: 8 }}>
                <InformationIcon
                  width={14}
                  height={14}
                  dataSet={{
                    tooltipId: tooltip.id,
                    tooltipContent: tooltip.content
                  }}
                />
              </View>
            </View>
          )}
        </Text>
      )}
      <View style={{ zIndex: 10 }}>
        <View style={inputWrapperStyles} ref={inputBorderWrapperRef}>
          {!!leftIcon && <View style={[styles.leftIcon, leftIconStyle]}>{leftIcon()}</View>}
          {/* TextInput doesn't support border styles so we wrap it in a View */}
          <View style={[inputStyles, hasButton ? { width: '100%' } : {}]}>
            {customInputContent}
            <TextInput
              placeholderTextColor={theme.secondaryText}
              autoCapitalize="none"
              autoCorrect={false}
              editable={editable ?? !disabled}
              onBlur={handleOnBlur}
              onFocus={handleOnFocus}
              ref={setInputRef}
              {...rest}
              style={[
                styles.nativeInput,
                !!customInputContent && { position: 'absolute', zIndex: -1, opacity: 0 },
                nativeInputStyle
              ]}
            />
          </View>
          {childrenBeforeButtons || null}
          {!!hasButton && (
            <AnimatedPressable
              // The `focusable` prop determines whether a component is user-focusable
              // and appears in the keyboard tab flow. It's missing in the
              // TouchableOpacity props, because it's react-native-web specific, see:
              // {@link https://necolas.github.io/react-native-web/docs/accessibility/#keyboard-focus}
              // @ts-ignore-next-line
              focusable={false}
              onPress={onButtonPress}
              disabled={disabled}
              style={[
                styles.button,
                buttonProps?.withBackground ? styles.buttonWithBackground : {},
                buttonStyle,
                animStyle
              ]}
              {...buttonProps}
              {...bindAnim}
            >
              {typeof button === 'string' || button instanceof String ? (
                <Text weight="medium">{button}</Text>
              ) : (
                button
              )}
            </AnimatedPressable>
          )}
        </View>
        {childrenBelowInput}
      </View>
      <View style={styles.errorContainer}>
        {!!error && (
          <Text
            style={[styles.bottomLabel, bottomLabelStyle]}
            weight={isWeb ? 'regular' : undefined}
            fontSize={10}
            appearance={errorType === 'warning' ? 'warningText' : 'errorText'}
          >
            {error}
          </Text>
        )}

        {!!isValid && !!validLabel && !error && (
          <Text
            style={[styles.bottomLabel, bottomLabelStyle]}
            weight="regular"
            fontSize={12}
            appearance={validLabelAppearance || 'successText'}
          >
            {validLabel}
          </Text>
        )}

        {!!info && (
          <Text
            weight="regular"
            appearance="secondaryText"
            style={[styles.bottomLabel, bottomLabelStyle]}
            fontSize={10}
          >
            {info}
          </Text>
        )}
        {!!preventJumpOnValidationChange && !error && !isValid && !info && (
          <Text
            style={[styles.bottomLabel, bottomLabelStyle]}
            weight="regular"
            fontSize={10}
            // Purposefully render a space to keep the input height consistent
          >
            {' '}
          </Text>
        )}
        {renderConfirmAddress && renderConfirmAddress()}
      </View>
    </View>
  )
}

export default React.memo(Input)
