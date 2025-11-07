import React from 'react'
import { TextProps, View, ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'

import ErrorIcon from '@common/assets/svg/ErrorIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Button, { Props as ButtonProps } from '@common/components/Button'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_LG } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import Text, { TextWeight } from '../Text'

interface Props {
  title?: string | React.ReactNode
  titleWeight?: TextWeight
  text?: string | React.ReactNode
  type?: 'error' | 'warning' | 'success' | 'info' | 'info2'
  style?: ViewStyle
  children?: React.ReactNode
  size?: 'sm' | 'md'
  isTypeLabelHidden?: boolean
  buttonProps?: ButtonProps
  customIcon?: React.FC<SvgProps>
  withIcon?: boolean
  testID?: string
}

const ICON_MAP = {
  error: ErrorIcon,
  warning: WarningIcon,
  success: SuccessIcon,
  info: InfoIcon,
  info2: InfoIcon
}

const SIZES = {
  title: 20,
  text: 16,
  icon: 40
}

const SIZE_MULTIPLIERS = {
  sm: 0.8,
  md: 1
}

interface AlertVerticalTextProps extends TextProps {
  children: React.ReactNode
  size?: Props['size']
  type?: Props['type']
}

const AlertVerticalText: React.FC<AlertVerticalTextProps> = ({
  children,
  size = 'md',
  type = 'info',
  style,
  ...rest
}) => {
  const fontSize = SIZES.text * SIZE_MULTIPLIERS[size]

  return (
    <Text
      selectable
      fontSize={fontSize}
      weight="regular"
      style={[spacings.mrTy, { textAlign: 'center' }, style]}
      appearance={`${type}Text`}
      {...rest}
    >
      {children}
    </Text>
  )
}

const AlertVertical = ({
  title,
  titleWeight,
  text,
  type = 'info',
  style,
  children,
  size = 'md',
  isTypeLabelHidden = true,
  buttonProps,
  customIcon: CustomIcon,
  withIcon = true,
  testID
}: Props) => {
  const Icon = ICON_MAP[type]
  const { theme } = useTheme()
  const sizeMultiplier = SIZE_MULTIPLIERS[size]
  const titleFontSize = SIZES.title * sizeMultiplier

  return (
    <View
      style={[
        common.borderRadiusPrimary,
        flexbox.alignCenter,
        {
          paddingHorizontal: SPACING_LG * sizeMultiplier,
          paddingVertical: SPACING_LG * sizeMultiplier,
          borderWidth: 1,
          backgroundColor: theme[`${type}Background`],
          borderColor: theme[`${type}Decorative`]
        },
        style
      ]}
      testID={testID}
    >
      {!!withIcon && (
        <View
          style={{
            marginBottom: SPACING * sizeMultiplier
          }}
        >
          {CustomIcon ? (
            <CustomIcon />
          ) : (
            <Icon
              width={SIZES.icon * sizeMultiplier}
              height={SIZES.icon * sizeMultiplier}
              color={theme[`${type}Decorative`]}
            />
          )}
        </View>
      )}
      {!!title && (
        <Text
          style={[
            text ? spacings.mbTy : {},
            {
              textAlign: 'center'
            }
          ]}
        >
          {!isTypeLabelHidden && (
            <Text
              selectable
              appearance={`${type}Text`}
              fontSize={titleFontSize}
              weight={titleWeight || 'semiBold'}
              style={{ textTransform: 'capitalize' }}
            >
              {type}:{' '}
            </Text>
          )}
          <Text
            selectable
            appearance={`${type}Text`}
            fontSize={titleFontSize}
            weight={titleWeight || 'semiBold'}
          >
            {title}
          </Text>
        </Text>
      )}
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifyCenter,
          {
            maxWidth: '100%'
          }
        ]}
      >
        {!!text &&
          (typeof text === 'string' ? (
            <AlertVerticalText size={size} type={type}>
              {text}{' '}
            </AlertVerticalText>
          ) : (
            text
          ))}
      </View>
      {buttonProps && (
        <Button
          style={{
            alignSelf: 'flex-end',
            ...spacings.mtTy
          }}
          textStyle={type === 'error' && { fontSize: 14 }}
          size="small"
          type="primary"
          hasBottomSpacing={false}
          text={buttonProps.text}
          onPress={buttonProps.onPress}
          {...buttonProps}
        />
      )}
      {children}
    </View>
  )
}

AlertVertical.Text = AlertVerticalText

export default AlertVertical
