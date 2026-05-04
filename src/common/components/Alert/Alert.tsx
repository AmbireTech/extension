import React from 'react'
import { StyleProp, TextProps, View, ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'

import ErrorIcon from '@common/assets/svg/ErrorIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Button, { ButtonTypes, Props as ButtonProps } from '@common/components/Button'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import Text, { TextWeight } from '../Text'

interface Props {
  title?: string | React.ReactNode
  titleWeight?: TextWeight
  text?: string | React.ReactNode
  type?: 'error' | 'warning' | 'success' | 'info'
  style?: ViewStyle
  children?: React.ReactNode
  size?: 'sm' | 'md'
  isTypeLabelHidden?: boolean
  buttonProps?: ButtonProps
  customIcon?: React.FC<SvgProps>
  withIcon?: boolean
  testID?: string
}

type AlertType = NonNullable<Props['type']>

const ICON_MAP = {
  error: ErrorIcon,
  warning: WarningIcon,
  success: SuccessIcon,
  info: InfoIcon
}

const ALERT_TYPE_TO_BUTTON: Record<AlertType, ButtonTypes> = {
  error: 'dangerFilled',
  warning: 'warning',
  success: 'success',
  info: 'info'
}

const { isPopup } = getUiType()

const DEFAULT_SM_FONT_SIZE = 14
const DEFAULT_MD_FONT_SIZE = 16

interface AlertTextProps extends TextProps {
  children: React.ReactNode
  size?: Props['size']
  type?: Props['type']
}

const AlertText: React.FC<AlertTextProps> = ({ children, size = 'md', type = 'info', ...rest }) => {
  const isSmall = size === 'sm' || isPopup
  const fontSize = !isSmall ? DEFAULT_MD_FONT_SIZE : DEFAULT_SM_FONT_SIZE

  return (
    <Text selectable fontSize={fontSize - 2} weight="regular" appearance="secondaryText" {...rest}>
      {children}
    </Text>
  )
}

const Alert = ({
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
  const isSmall = size === 'sm' || isPopup
  const fontSize = !isSmall ? DEFAULT_MD_FONT_SIZE : DEFAULT_SM_FONT_SIZE

  return (
    <View
      style={[
        !isSmall ? spacings.ph : spacings.phSm,
        !isSmall ? spacings.pv : spacings.pvSm,
        flexbox.directionRow,
        common.borderRadiusPrimary,
        {
          backgroundColor: theme[`${type}Background`]
        },
        style
      ]}
      testID={testID}
    >
      <View style={isMobile ? { flexShrink: 1 } : flexbox.flex1}>
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            text ? (!isSmall ? spacings.mbTy : spacings.mbMi) : {}
          ]}
        >
          {!!withIcon && (
            <View style={spacings.mrMi}>
              {CustomIcon ? (
                <CustomIcon width={18} height={18} />
              ) : (
                <Icon width={18} height={18} color={theme[`${type}Text`]} />
              )}
            </View>
          )}
          {!!title && (
            <Text>
              {!isTypeLabelHidden && (
                <Text
                  selectable
                  appearance="primaryText"
                  fontSize={fontSize}
                  weight={titleWeight || 'semiBold'}
                  style={{ textTransform: 'capitalize' }}
                >
                  {type}:{' '}
                </Text>
              )}
              <Text
                selectable
                appearance="primaryText"
                fontSize={fontSize}
                weight={titleWeight || 'semiBold'}
              >
                {title}
              </Text>
            </Text>
          )}
        </View>
        {!!text &&
          (typeof text === 'string' ? (
            <AlertText size={size} type={type}>
              {text}
            </AlertText>
          ) : (
            text
          ))}
        {buttonProps &&
          (() => {
            const {
              style: buttonStyleFromProps,
              type: buttonTypeOverride,
              textStyle: buttonTextStyleFromProps,
              size: buttonSizeOverride,
              hasBottomSpacing: buttonHasBottomSpacing,
              text: buttonText,
              onPress: buttonOnPress,
              ...restButtonProps
            } = buttonProps

            return (
              <Button
                {...restButtonProps}
                text={buttonText}
                onPress={buttonOnPress}
                size={buttonSizeOverride ?? 'small'}
                type={buttonTypeOverride ?? ALERT_TYPE_TO_BUTTON[type]}
                hasBottomSpacing={buttonHasBottomSpacing ?? false}
                textStyle={buttonTextStyleFromProps}
                style={
                  [
                    {
                      alignSelf: 'flex-end',
                      ...spacings.mtTy
                    },
                    buttonStyleFromProps
                  ] as StyleProp<ViewStyle>
                }
              />
            )
          })()}
        {children}
      </View>
    </View>
  )
}

Alert.Text = AlertText

export default Alert
