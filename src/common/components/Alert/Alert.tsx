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
import { THEME_TYPES } from '@common/styles/themeConfig'
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
  /** Places the action button on the top-right, aligned with the title row */
  isButtonTopRight?: boolean
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

const ALERT_PRIMARY_BUTTON_BG_KEY: Record<
  AlertSeverity,
  {
    light: 'error300' | 'warning300' | 'success300' | 'info300'
    dark: 'error300' | 'warning400' | 'success400' | 'info300'
  }
> = {
  error: { light: 'error300', dark: 'error300' },
  warning: { light: 'warning300', dark: 'warning400' },
  success: { light: 'success300', dark: 'success400' },
  info: { light: 'info300', dark: 'info300' }
}

type AlertPrimaryButtonProps = Omit<ButtonProps, 'type'> & {
  severity: AlertSeverity
}

const AlertPrimaryButton = React.memo(
  ({ severity, style, textStyle, ...rest }: AlertPrimaryButtonProps) => {
    const { theme, themeType } = useTheme()
    const backgroundColorKey =
      themeType === THEME_TYPES.DARK
        ? ALERT_PRIMARY_BUTTON_BG_KEY[severity].dark
        : ALERT_PRIMARY_BUTTON_BG_KEY[severity].light
    const backgroundColor = theme[backgroundColorKey] as string
    const textColor =
      themeType === THEME_TYPES.LIGHT ? '#FFFFFF' : (theme[`${severity}100`] as string)

    return (
      <Button
        {...rest}
        type="info"
        accentColor={textColor}
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
  isButtonTopRight = false,
  customIcon: CustomIcon,
  withIcon = true,
  testID
}: Props) => {
  const Icon = ICON_MAP[type]
  const { theme } = useTheme()
  const isSmall = size === 'sm' || isPopup
  const fontSize = !isSmall ? DEFAULT_MD_FONT_SIZE : DEFAULT_SM_FONT_SIZE

  const renderButton = (buttonStyle?: StyleProp<ViewStyle>) => {
    if (!buttonProps) return null

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
        style={[buttonStyle, buttonStyleFromProps] as StyleProp<ViewStyle>}
      />
    )
  }

  const titleContent = !!title && (
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
  )

  const textContent =
    !!text &&
    (typeof text === 'string' ? (
      <AlertText size={size} type={type}>
        {text}
      </AlertText>
    ) : (
      text
    ))

  const titleRowMarginBottom = text ? (!isSmall ? spacings.mbTy : spacings.mbMi) : {}

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
        {isButtonTopRight ? (
          <View style={[flexbox.directionRow, flexbox.alignStart]}>
            {!!withIcon && (
              <View style={spacings.mrMi}>
                {CustomIcon ? (
                  <CustomIcon width={24} height={24} />
                ) : (
                  <Icon width={24} height={24} color={theme[`${type}Text`]} />
                )}
              </View>
            )}
            <View style={flexbox.flex1}>
              <View style={[flexbox.directionRow, flexbox.alignStart, titleRowMarginBottom]}>
                {!!title && <View style={[flexbox.flex1, spacings.mrSm]}>{titleContent}</View>}
                {renderButton({ flexShrink: 0 })}
              </View>
              {textContent}
            </View>
          </View>
        ) : (
          <>
            <View style={[flexbox.directionRow, flexbox.alignCenter, titleRowMarginBottom]}>
              {!!withIcon && (
                <View style={spacings.mrMi}>
                  {CustomIcon ? (
                    <CustomIcon width={24} height={24} />
                  ) : (
                    <Icon width={24} height={24} color={theme[`${type}Text`]} />
                  )}
                </View>
              )}
              {titleContent}
            </View>
            {textContent}
            {renderButton({ alignSelf: 'flex-end', ...spacings.mtTy })}
          </>
        )}
        {children}
      </View>
    </View>
  )
}

Alert.Text = AlertText

export default Alert
