import React, { useMemo } from 'react'
import { TextStyle, View, ViewStyle } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
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
  isCentered?: boolean
  children?: React.ReactNode
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
  style = {},
  isCentered = false,
  children
}: Props) => {
  const { styles, theme } = useTheme(getStyles)
  const typeLabel = `${type.charAt(0).toUpperCase()}${type.slice(1)}`
  const textParts = useMemo(() => {
    let offset = 0

    return text.split(' ').map((word) => {
      const part = { key: `${offset}-${word}`, value: word }
      offset += word.length + 1

      return part
    })
  }, [text])

  const textStyle = [
    textStyles.left,
    type === 'warning' && styles.warningText,
    type === 'error' && styles.errorText,
    customTextStyle
  ]
  const icon = (
    <>
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
    </>
  )

  if (isCentered) {
    return (
      <View
        style={[
          styles.container,
          !!hasBottomSpacing && spacings.mbTy,
          !!hasRightSpacing && spacings.mrTy,
          { flexDirection: 'column', alignItems: 'center' },
          style
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={spacings.mrTy}>{icon}</View>
          {!isTypeLabelHidden && (
            <Text fontSize={16 * sizeMultiplier[size]} weight="semiBold" style={textStyle}>
              {`${typeLabel}:`}
            </Text>
          )}
        </View>
        <View
          style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyCenter, flexbox.wrap]}
        >
          {textParts.map((part) => (
            <Text
              key={part.key}
              fontSize={16 * sizeMultiplier[size]}
              weight="regular"
              style={[textStyle, { textAlign: 'center' }]}
            >
              {`${part.value} `}
            </Text>
          ))}
          {children}
        </View>
      </View>
    )
  }

  if (children) {
    return (
      <View
        style={[
          styles.container,
          !!hasBottomSpacing && spacings.mbTy,
          !!hasRightSpacing && spacings.mrTy,
          style
        ]}
      >
        <View style={spacings.mrTy}>{icon}</View>
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.wrap, flexbox.flex1]}>
          {!isTypeLabelHidden && (
            <Text fontSize={16 * sizeMultiplier[size]} weight="semiBold" style={textStyle}>
              {`${typeLabel}: `}
            </Text>
          )}
          {textParts.map((part) => (
            <Text
              key={part.key}
              fontSize={16 * sizeMultiplier[size]}
              weight="regular"
              style={textStyle}
            >
              {`${part.value} `}
            </Text>
          ))}
          {children}
        </View>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        !!hasBottomSpacing && spacings.mbTy,
        !!hasRightSpacing && spacings.mrTy,
        style
      ]}
    >
      <View style={spacings.mrTy}>{icon}</View>
      <Text style={isMobile ? { flexShrink: 1 } : undefined}>
        {!isTypeLabelHidden && (
          <Text fontSize={16 * sizeMultiplier[size]} weight="semiBold" style={textStyle}>
            {`${typeLabel}: `}
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
