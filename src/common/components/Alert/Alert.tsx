import React from 'react'
import { StyleProp, TextProps, TextStyle, View, ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'

import ErrorIcon from '@common/assets/svg/ErrorIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Button, { Props as ButtonProps } from '@common/components/Button'
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

const ICON_MAP = {
  error: ErrorIcon,
  warning: WarningIcon,
  success: SuccessIcon,
  info: InfoIcon
}

type AlertSeverity = 'error' | 'warning' | 'success' | 'info'

const SEVERITY_FILL_THEME_KEY: Record<
  AlertSeverity,
  'error300' | 'warning300' | 'success300' | 'info300'
> = {
  error: 'error300',
  warning: 'warning300',
  success: 'success300',
  info: 'info300'
}

type AlertPrimaryButtonProps = Omit<ButtonProps, 'type'> & {
  severity: AlertSeverity
}

const AlertPrimaryButton = React.memo(
  ({ severity, style, textStyle, ...rest }: AlertPrimaryButtonProps) => {
    const { theme } = useTheme()
    const backgroundColor = theme[SEVERITY_FILL_THEME_KEY[severity]] as string
    const textColor = theme[`${severity}100`] as string

    return (
      <Button
        {...rest}
        type="info"
        style={[{ backgroundColor, borderWidth: 0 }, style] as StyleProp<ViewStyle>}
        textStyle={[{ color: textColor }, textStyle] as StyleProp<TextStyle>}
      />
    )
  }
)

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
              type: _buttonTypeFromProps,
              textStyle: buttonTextStyleFromProps,
              size: buttonSizeOverride,
              hasBottomSpacing: buttonHasBottomSpacing,
              text: buttonText,
              onPress: buttonOnPress,
              ...restButtonProps
            } = buttonProps

            return (
              <AlertPrimaryButton
                {...restButtonProps}
                severity={type}
                text={buttonText}
                onPress={buttonOnPress}
                size={buttonSizeOverride ?? 'small'}
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
