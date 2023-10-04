import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import {
  Animated,
  ColorValue,
  Pressable,
  PressableProps,
  Text,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle
} from 'react-native'

import { isWeb } from '@common/config/env'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'

import styles from './styles'

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

type ButtonTypes = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'

type ButtonSizes = 'regular' | 'small'
export interface Props extends TouchableOpacityProps {
  text?: string
  type?: ButtonTypes
  size?: ButtonSizes
  textStyle?: any
  accentColor?: ColorValue
  hasBottomSpacing?: boolean
  containerStyle?: PressableProps['style']
}

const containerStyles: { [key in ButtonTypes]: ViewStyle } = {
  primary: styles.buttonContainerPrimary,
  secondary: styles.buttonContainerSecondary,
  danger: styles.buttonContainerDanger,
  outline: styles.buttonContainerOutline,
  ghost: styles.buttonContainerGhost
}

const containerStylesSizes: { [key in ButtonSizes]: ViewStyle } = {
  regular: styles.buttonContainerStylesSizeRegular,
  small: styles.buttonContainerStylesSizeSmall
}

const noGradient = ['transparent', 'transparent']

const gradientColors: { [key in ButtonTypes]: string[] } = {
  primary: [colors.violet, colors.heliotrope],
  secondary: noGradient,
  danger: noGradient,
  outline: noGradient,
  ghost: noGradient
}

const gradientColorsPressed: { [key in ButtonTypes]: string[] } = {
  ...gradientColors,
  primary: [colors.heliotrope, colors.violet],
  outline: [colors.martinique, colors.martinique]
}

// Gradient colors applied when button is disabled
const gradientDisabledColors: { [key in ButtonTypes]: string[] } = {
  ...gradientColors,
  primary: [colors.darkViolet, colors.violet]
}

const gradientColorsLocations: { [key in ButtonTypes]: number[] | undefined } = {
  primary: [0, 1],
  secondary: undefined,
  danger: undefined,
  outline: undefined,
  ghost: undefined
}

const gradientColorsLocationsPressed: { [key in ButtonTypes]: number[] | undefined } = {
  primary: [0, 1],
  secondary: undefined,
  danger: undefined,
  outline: undefined,
  ghost: undefined
}

const gradientColorsLocationsDisabledPressed: { [key in ButtonTypes]: number[] | undefined } = {
  primary: [0, 1],
  secondary: undefined,
  danger: undefined,
  outline: undefined,
  ghost: undefined
}

const buttonTextStyles: { [key in ButtonTypes]: TextStyle } = {
  primary: styles.buttonTextPrimary,
  secondary: styles.buttonTextSecondary,
  danger: styles.buttonTextDanger,
  outline: styles.buttonTextOutline,
  ghost: styles.buttonTextGhost
}

const buttonTextStylesSizes: { [key in ButtonSizes]: TextStyle } = {
  regular: styles.buttonTextStylesSizeRegular,
  small: styles.buttonTextStylesSizeSmall
}

const Button = ({
  type = 'primary',
  size = 'regular',
  accentColor,
  text,
  style = {},
  containerStyle = {},
  textStyle = {},
  disabled = false,
  hasBottomSpacing = true,
  children,
  ...rest
}: Props) => {
  const animated = new Animated.Value(1)

  const fadeIn = () =>
    Animated.timing(animated, { toValue: 0.7, duration: 100, useNativeDriver: !isWeb }).start()
  const fadeOut = () =>
    Animated.timing(animated, { toValue: 1, duration: 200, useNativeDriver: !isWeb }).start()

  return (
    <Pressable
      disabled={disabled}
      style={containerStyle}
      // Animates all other components to mimic the TouchableOpacity effect
      onPressIn={type === 'primary' ? null : fadeIn}
      onPressOut={type === 'primary' ? null : fadeOut}
      {...rest}
    >
      {({ pressed }) => {
        const colorsIfPressed = pressed ? gradientColorsPressed[type] : gradientColors[type]
        const currentColors = disabled ? gradientDisabledColors[type] : colorsIfPressed

        const locationsIfPressed = pressed
          ? gradientColorsLocationsPressed[type]
          : gradientColorsLocations[type]
        const currentLocations = disabled
          ? gradientColorsLocationsDisabledPressed[type]
          : locationsIfPressed

        return (
          <AnimatedLinearGradient
            colors={currentColors}
            locations={currentLocations}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              containerStylesSizes[size],
              styles.buttonContainer,
              containerStyles[type],
              style,
              !!accentColor && { borderColor: accentColor },
              !hasBottomSpacing && spacings.mb0,
              { opacity: animated },
              disabled && styles.disabled
            ]}
          >
            {!!text && (
              <Text
                style={[
                  styles.buttonText,
                  buttonTextStyles[type],
                  buttonTextStylesSizes[size],
                  !!accentColor && { color: accentColor },
                  textStyle
                ]}
              >
                {text}
              </Text>
            )}
            {children}
          </AnimatedLinearGradient>
        )
      }}
    </Pressable>
  )
}

export default React.memo(Button)
