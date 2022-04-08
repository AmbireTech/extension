import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import {
  ColorValue,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle
} from 'react-native'

import { colorPalette as colors } from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'

import styles from './styles'

type ButtonTypes = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'

type ButtonSizes = 'regular' | 'small'
interface Props extends TouchableOpacityProps {
  text: string
  type?: ButtonTypes
  size?: ButtonSizes
  textStyle?: any
  accentColor?: ColorValue
  hasBottomSpacing?: boolean
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
  // TODO: This is the style when tapped
  primary: [colors.violet, colors.heliotrope],
  // TODO: This is the style by default
  // primary: ['#6000FF', '#6000FF', '#923DFF'],
  secondary: noGradient,
  danger: noGradient,
  outline: noGradient,
  ghost: noGradient
}

// Gradient colors applied when button is disabled
const gradientDisabledColors: { [key in ButtonTypes]: string[] } = {
  ...gradientColors,
  primary: [colors.darkViolet, colors.violet]
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
  textStyle = {},
  disabled = false,
  hasBottomSpacing = true,
  ...rest
}: Props) => (
  <TouchableOpacity disabled={disabled} style={styles.buttonWrapper} {...rest}>
    <LinearGradient
      colors={disabled ? gradientDisabledColors[type] : gradientColors[type]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      // TODO: This is the style by default
      // locations={[0, 0.25, 1]}
      // TODO: This is the style when tapped
      locations={[0, 1]}
      style={[
        styles.buttonContainer,
        containerStyles[type],
        containerStylesSizes[size],
        disabled && styles.disabled,
        style,
        !!accentColor && { borderColor: accentColor },
        !hasBottomSpacing && spacings.mb0
      ]}
    >
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
    </LinearGradient>
  </TouchableOpacity>
)

export default Button
