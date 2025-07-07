import React from 'react'
import { TextStyle, View, ViewStyle } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import textStyles from '@common/styles/utils/text'

import getStyles from './styles'

type Props = {
  text: string
  type: 'error' | 'warning' | 'info' | 'success'
  hasBottomSpacing?: boolean
  hasRightSpacing?: boolean
  isTypeLabelHidden?: boolean
  size?: 'sm' | 'md' | 'lg'
  customTextStyle?: TextStyle
  style?: ViewStyle
}

const sizeMultiplier = {
  sm: 0.75,
  md: 0.85,
  lg: 1
}

const Label = ({
  text,
  type,
  hasBottomSpacing = true,
  hasRightSpacing = true,
  isTypeLabelHidden = false,
  size = 'lg',
  customTextStyle = {},
  style = {}
}: Props) => {
  const { styles, theme } = useTheme(getStyles)

  const textStyle = [
    textStyles.capitalize,
    textStyles.left,
    type === 'warning' && styles.warningText,
    type === 'error' && styles.errorText,
    customTextStyle
  ]

  return (
    <View
      style={[
        styles.container,
        !!hasBottomSpacing && spacings.mbTy,
        !!hasRightSpacing && spacings.mrTy,
        style
      ]}
    >
      <View style={spacings.mrTy}>
        {type === 'warning' && (
          <WarningIcon
            color={theme.warningDecorative}
            width={20 * sizeMultiplier[size]}
            height={19 * sizeMultiplier[size]}
          />
        )}
        {type === 'error' && (
          <WarningIcon
            color={theme.errorDecorative}
            width={20 * sizeMultiplier[size]}
            height={19 * sizeMultiplier[size]}
          />
        )}
        {type === 'info' && (
          <InfoIcon
            color={theme.infoDecorative}
            width={20 * sizeMultiplier[size]}
            height={19 * sizeMultiplier[size]}
          />
        )}
        {type === 'success' && (
          <SuccessIcon
            color={theme.successDecorative}
            width={20 * sizeMultiplier[size]}
            height={19 * sizeMultiplier[size]}
          />
        )}
      </View>
      <Text>
        {!isTypeLabelHidden && (
          <Text fontSize={16 * sizeMultiplier[size]} weight="semiBold" style={textStyle}>
            {`${type}: `}
          </Text>
        )}
        <Text fontSize={16 * sizeMultiplier[size]} weight="regular" style={textStyle}>
          {text}
        </Text>
      </Text>
    </View>
  )
}

export default Label
