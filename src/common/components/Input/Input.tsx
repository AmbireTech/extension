import React, { ReactNode, useState } from 'react'
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  TextStyle,
  TouchableOpacityProps,
  View,
  ViewStyle
} from 'react-native'

import InformationIcon from '@common/assets/svg/InformationIcon'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
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
  button?: string | JSX.Element | null
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
  borderWrapperStyle?: ViewStyle
  inputWrapperStyle?: ViewStyle | ViewStyle[]
  bottomLabelStyle?: TextStyle | TextStyle[]
  leftIcon?: () => ReactNode
  leftIconStyle?: ViewStyle
  tooltip?: {
    id: string
    content: string
  }
  childrenBeforeButtons?: React.ReactNode
  childrenBelowInput?: React.ReactNode
  borderless?: boolean
  customInputContent?: React.ReactNode
  renderConfirmAddress?: () => React.ReactNode
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
  onBlur = () => {},
  onFocus = () => {},
  onButtonPress = () => {},
  disabled,
  containerStyle,
  inputStyle,
  nativeInputStyle,
  borderWrapperStyle,
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
  renderConfirmAddress,
  ...rest
}: InputProps) => {
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const { theme, styles, themeType } = useTheme(getStyles)
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })

  const handleOnFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    if (disabled) return
    setIsFocused(true)
    return onFocus(e)
  }
  const handleOnBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    if (disabled) return
    setIsFocused(false)
    return onBlur(e)
  }

  const hasButton = !!button

  const borderWrapperStyles = [
    styles.borderWrapper,
    isFocused && {
      borderColor:
        themeType === THEME_TYPES.DARK ? `${theme.linkText as string}35` : theme.infoBackground
    },
    isValid && { borderColor: theme.successBackground },
    !!error && { borderColor: theme.errorBackground },
    borderless && { borderColor: 'transparent', borderWidth: 0 },
    borderWrapperStyle
  ]

  const inputWrapperStyles = [
    styles.inputWrapper,
    {
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.primaryBackground : theme.secondaryBackground,
      borderColor: theme.secondaryBorder
    },
    isFocused && {
      borderColor: themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary
    },
    isValid && { borderColor: theme.successDecorative },
    !!error && { borderColor: theme.errorDecorative },
    info && { borderColor: theme.warningText },
    disabled && styles.disabled,
    borderless && { borderColor: 'transparent', borderWidth: 0 },
    inputWrapperStyle
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
        <View style={borderWrapperStyles} ref={inputBorderWrapperRef}>
          <View style={inputWrapperStyles}>
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
        </View>
        {childrenBelowInput}
      </View>
      <View style={styles.errorContainer}>
        <View>
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
              color={theme.successText}
            >
              {validLabel}
            </Text>
          )}

          {!!info && (
            <Text
              weight="regular"
              appearance="warningText"
              style={[styles.bottomLabel, bottomLabelStyle]}
              fontSize={10}
            >
              {info}
            </Text>
          )}
        </View>
        {renderConfirmAddress && renderConfirmAddress()}
      </View>
    </View>
  )
}

export default React.memo(Input)
