import React, { useMemo } from 'react'
import { Animated, ColorValue, PressableProps, TextStyle, ViewStyle } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import { isMobile, isWeb } from '@common/config/env'
import { AnimatedPressable, useCustomHover, useMultiHover } from '@common/hooks/useHover'
import { AnimatedText } from '@common/hooks/useHover/useHover'
import { AnimationValues } from '@common/hooks/useHover/useMultiHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common, { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import useOnEnterKeyPress from '@web/hooks/useOnEnterKeyPress'

import { createGlobalTooltipDataSet } from '../GlobalTooltip'
import getStyles from './styles'

type ButtonTypes =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  // Use danger if the button is a secondary action and dangerFilled
  // if it's the primary action on the screen
  | 'danger'
  | 'dangerFilled'
  | 'outline'
  | 'ghost'
  | 'ghost2'
  | 'warning'
  | 'info'
  | 'success'
  | 'gray'

// We should rethink these sizes
type ButtonSizes = 'regular' | 'smaller' | 'small' | 'large' | 'tiny'
export interface Props extends PressableProps {
  text?: string
  type?: ButtonTypes
  size?: ButtonSizes
  textStyle?: any
  textUnderline?: boolean
  accentColor?: ColorValue
  hasBottomSpacing?: boolean
  containerStyle?: PressableProps['style']
  disabledStyle?: ViewStyle
  forceHoveredStyle?: boolean
  children?: React.ReactNode
  childrenPosition?: 'left' | 'right'
  childrenContainerStyle?: ViewStyle
  innerContainerStyle?: (hovered: boolean) => ViewStyle
  testID?: string
  submitOnEnter?: boolean
  tooltipDataSet?: ReturnType<typeof createGlobalTooltipDataSet>
}

const OPACITY_ANIMATION = {
  property: 'opacity' as keyof ViewStyle,
  from: 1,
  to: 0.7
}

const buttonTypesWithInnerContainer = ['ghost']

const ButtonInnerContainer = ({
  type,
  forceHoveredStyle,
  children,
  innerContainerStyle,
  ...rest
}: {
  type: ButtonTypes
  forceHoveredStyle?: boolean
  children?: React.ReactNode
  innerContainerStyle?: (hovered: boolean) => ViewStyle
} & PressableProps) => {
  const { theme } = useTheme()

  const buttonInnerContainerColors = useMemo(
    () => ({
      primary: [],
      secondary: [],
      tertiary: [],
      danger: [],
      dangerFilled: [],
      outline: [],
      ghost: [
        {
          property: 'backgroundColor',
          from: `${String(theme.neutral400)}00`,
          to: theme.neutral400
        }
      ],
      ghost2: [],
      warning: [],
      info: [],
      info2: [],
      success: [],
      gray: []
    }),
    [theme]
  )

  const [buttonInnerContainerBind, buttonInnerContainerAnimatedStyle, isHovered] = useMultiHover({
    values: buttonInnerContainerColors[type],
    forceHoveredStyle
  })

  if (buttonInnerContainerColors[type]?.length) {
    return (
      <AnimatedPressable
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.phTy,
          spacings.pvMi,
          common.borderRadiusPrimary,
          { height: 32 },
          buttonInnerContainerAnimatedStyle,
          !!innerContainerStyle && innerContainerStyle(isHovered)
        ]}
        {...buttonInnerContainerBind}
        {...rest}
        onHoverIn={(e) => {
          !!rest.onHoverIn && rest.onHoverIn(e)
          buttonInnerContainerBind.onHoverIn(e)
        }}
        onHoverOut={(e) => {
          !!rest.onHoverOut && rest.onHoverOut(e)
          buttonInnerContainerBind.onHoverOut(e)
        }}
        onPressIn={(e: any) => {
          !!rest.onPressIn && rest.onPressIn(e)
          buttonInnerContainerBind.onPressIn(e)
        }}
        onPressOut={(e: any) => {
          !!rest.onPressOut && rest.onPressOut(e)
          buttonInnerContainerBind.onPressOut(e)
        }}
      >
        {children}
      </AnimatedPressable>
    )
  }

  return children
}

const Button = ({
  type = 'primary',
  size = 'regular',
  accentColor,
  text,
  style = {},
  textStyle = {},
  textUnderline,
  disabled = false,
  hasBottomSpacing = true,
  children,
  disabledStyle,
  forceHoveredStyle = false,
  childrenPosition = 'right',
  childrenContainerStyle,
  testID,
  submitOnEnter: _submitOnEnter,
  tooltipDataSet,
  ...rest
}: Props) => {
  const { styles, theme } = useTheme(getStyles)
  const submitOnEnter = _submitOnEnter ?? type === 'primary'

  useOnEnterKeyPress({
    action: rest.onPress,
    disabled: !!disabled || !submitOnEnter
  })

  const buttonColors: {
    [key in ButtonTypes]: AnimationValues[]
  } = useMemo(
    () => ({
      primary: [
        {
          property: 'backgroundColor',
          from: theme.primaryAccent,
          to: theme.primaryAccentHovered
        }
      ],
      secondary: [
        {
          property: 'backgroundColor',
          from: isMobile ? theme.secondaryBackground : theme.primaryBackground,
          to: theme.tertiaryBackground
        }
      ],
      tertiary: [
        {
          property: 'backgroundColor',
          from: theme.secondaryBackground,
          to: theme.tertiaryBackground
        }
      ],
      danger: [
        {
          property: 'backgroundColor',
          from: theme.errorBackground,
          to: theme.error300
        }
      ],
      dangerFilled: [
        {
          property: 'backgroundColor',
          from: theme.error200,
          to: theme.error300
        }
      ],
      outline: [
        {
          property: 'backgroundColor',
          from: hexToRgba(theme.tertiaryBackground, 0),
          to: hexToRgba(theme.tertiaryBackground, 1)
        },
        {
          property: 'borderColor',
          from: theme.primaryBorder,
          to: theme.neutral400
        }
      ],
      ghost: [],
      ghost2: [],
      warning: [
        {
          property: 'backgroundColor',
          from: theme.warningBackground,
          to: theme.warning400
        }
      ],
      info: [OPACITY_ANIMATION],
      success: [OPACITY_ANIMATION],
      gray: [
        {
          property: 'backgroundColor',
          from: `${String(theme.neutral400)}00`,
          to: theme.neutral400
        }
      ]
    }),
    [theme]
  )

  const [buttonContainerBind, buttonContainerAnimatedStyle] = useMultiHover({
    values: buttonColors[type],
    forceHoveredStyle
  })

  const containerStyles: { [key in ButtonTypes]: ViewStyle } = {
    primary: styles.buttonContainerPrimary,
    secondary: styles.buttonContainerSecondary,
    tertiary: styles.buttonContainerSecondary,
    danger: styles.buttonContainerDanger,
    outline: styles.buttonContainerOutline,
    ghost: styles.buttonContainerGhost,
    ghost2: {},
    dangerFilled: {
      backgroundColor: theme.error200,
      borderWidth: 0
    },
    warning: {
      borderColor: theme.warningDecorative,
      borderWidth: 1
    },
    info: {
      backgroundColor: theme.infoText,
      borderWidth: 0
    },
    success: {
      backgroundColor: theme.successText,
      borderWidth: 0
    },
    gray: {
      backgroundColor: theme.neutral400,
      borderWidth: 0
    }
  }

  const containerStylesSizes: { [key in ButtonSizes]: ViewStyle } = {
    large: styles.buttonContainerStylesSizeLarge,
    regular: styles.buttonContainerStylesSizeRegular,
    smaller: styles.buttonContainerStylesSmaller,
    small: styles.buttonContainerStylesSizeSmall,
    tiny: styles.buttonContainerStylesSizeTiny
  }

  // @ts-ignore
  const buttonTextColors: {
    [key in ButtonTypes]: AnimationValues[]
  } = useMemo(
    () => ({
      primary: [
        {
          property: 'color',
          from: '#fff',
          to: '#fff'
        }
      ],
      secondary: [
        {
          property: 'color',
          from: theme.primaryText,
          to: theme.primaryText
        }
      ],
      tertiary: [
        {
          property: 'color',
          from: theme.primaryText,
          to: theme.primaryText
        }
      ],
      danger: [
        {
          property: 'color',
          from: theme.errorText,
          to: theme.error100
        }
      ],
      dangerFilled: [
        {
          property: 'color',
          from: '#fff',
          to: '#fff'
        }
      ],
      outline: [
        {
          property: 'color',
          from: theme.primaryText,
          to: theme.primaryText
        }
      ],
      ghost: [
        {
          property: 'color',
          from: theme.primaryText,
          to: theme.primaryText
        }
      ],
      ghost2: [
        {
          property: 'color',
          from: theme.secondaryText,
          to: theme.primaryText
        }
      ],
      warning: [
        {
          property: 'color',
          from: theme.warningText,
          to: theme.warning100
        }
      ],
      info: [
        {
          property: 'color',
          from: theme.primaryBackground,
          to: theme.primaryBackground
        }
      ],
      success: [
        {
          property: 'color',
          from: theme.primaryBackground,
          to: theme.primaryBackground
        }
      ],
      gray: [
        {
          property: 'color',
          from: theme.primaryText,
          to: theme.primaryText
        }
      ]
    }),
    [theme]
  )

  const [buttonTextBind, buttonTextAnimatedStyle, isHovered] = useMultiHover({
    values: buttonTextColors[type],
    forceHoveredStyle
  })

  const buttonTextStylesSizes: { [key in ButtonSizes]: TextStyle } = {
    large: styles.buttonTextStylesSizeLarge,
    regular: styles.buttonTextStylesSizeRegular,
    smaller: styles.buttonTextStylesSizeSmaller,
    small: styles.buttonTextStylesSizeSmall,
    tiny: styles.buttonTextStylesSizeTiny
  }

  const [childrenScaleBind, childrenScaleAnimationStyle] = useCustomHover({
    property: 'scaleX',
    values: { from: 1, to: 1.1 }
  })

  const fromColor = buttonTextColors[type][0]?.from
  const toColor = buttonTextColors[type][0]?.to

  const effectiveColor = isHovered ? toColor : fromColor

  const enhancedChildren = React.Children.toArray(children).map((child, index) => {
    if (index === 0 && React.isValidElement(child)) {
      const childProps = child.props as any
      const extraProps: any = {}

      if (childProps.color === undefined) extraProps.color = accentColor || effectiveColor

      extraProps.className = [childProps.className, 'button-icon'].filter(Boolean).join(' ')

      return React.cloneElement(child, extraProps)
    }

    return child
  })

  return (
    <AnimatedPressable
      testID={testID}
      disabled={disabled}
      style={
        [
          containerStylesSizes[size],
          styles.buttonContainer,
          containerStyles[type],
          style,
          !!accentColor && { borderColor: accentColor },
          !hasBottomSpacing && spacings.mb0,
          buttonContainerAnimatedStyle,
          disabled && disabledStyle ? disabledStyle : {},
          disabled && !disabledStyle ? styles.disabled : {}
        ] as ViewStyle[]
      }
      {...rest}
      onHoverIn={(e) => {
        if (buttonTypesWithInnerContainer.includes(type)) return

        buttonContainerBind.onHoverIn(e)
        buttonTextBind.onHoverIn(e)
        childrenScaleBind.onHoverIn(e)

        rest?.onHoverIn && rest.onHoverIn(e)
      }}
      onHoverOut={(e) => {
        if (buttonTypesWithInnerContainer.includes(type)) return

        buttonContainerBind.onHoverOut(e)
        buttonTextBind.onHoverOut(e)
        childrenScaleBind.onHoverOut(e)

        rest?.onHoverOut && rest.onHoverOut(e)
      }}
      onPressIn={(e) => {
        if (buttonTypesWithInnerContainer.includes(type)) return

        buttonContainerBind.onPressIn(e)
        buttonTextBind.onPressIn(e)
        childrenScaleBind.onPressIn(e)

        rest?.onPressIn && rest.onPressIn(e)
      }}
      onPressOut={(e) => {
        if (buttonTypesWithInnerContainer.includes(type)) return

        buttonContainerBind.onPressOut(e)
        buttonTextBind.onPressOut(e)
        childrenScaleBind.onPressOut(e)

        rest?.onPressOut && rest.onPressOut(e)
      }}
    >
      {/* @ts-ignore */}
      <ButtonInnerContainer
        type={type}
        forceHoveredStyle={forceHoveredStyle}
        {...rest}
        onHoverIn={(e) => {
          buttonContainerBind.onHoverIn(e)
          buttonTextBind.onHoverIn(e)
          childrenScaleBind.onHoverIn(e)

          rest?.onHoverIn && rest.onHoverIn(e)
        }}
        onHoverOut={(e) => {
          buttonContainerBind.onHoverOut(e)
          buttonTextBind.onHoverOut(e)
          childrenScaleBind.onHoverOut(e)

          rest?.onHoverOut && rest.onHoverOut(e)
        }}
        onPressIn={(e) => {
          buttonContainerBind.onPressIn(e)
          buttonTextBind.onPressIn(e)
          childrenScaleBind.onPressIn(e)

          rest?.onPressIn && rest.onPressIn(e)
        }}
        onPressOut={(e) => {
          buttonContainerBind.onPressOut(e)
          buttonTextBind.onPressOut(e)
          childrenScaleBind.onPressOut(e)

          rest?.onPressOut && rest.onPressOut(e)
        }}
      >
        {childrenPosition === 'left' && (
          <Animated.View
            style={[
              childrenContainerStyle || {
                transform: [{ scale: childrenScaleAnimationStyle.scaleX as number }]
              }
            ]}
          >
            {enhancedChildren}
          </Animated.View>
        )}

        {!!text && (
          <AnimatedText
            selectable={false}
            style={[
              styles.buttonText,
              !!textUnderline && styles.buttonTextUnderline,
              buttonTextStylesSizes[size],
              { ...buttonTextAnimatedStyle },
              !!accentColor && { color: accentColor },
              textStyle
            ]}
          >
            {text}
          </AnimatedText>
        )}
        {!!tooltipDataSet && isWeb && (
          <InfoIcon
            width={16}
            height={16}
            style={{
              ...flexbox.alignSelfStart,
              ...spacings.mlMi
            }}
            dataSet={tooltipDataSet}
          />
        )}

        {childrenPosition === 'right' && (
          <Animated.View
            style={[
              childrenContainerStyle || {
                transform: [{ scale: childrenScaleAnimationStyle.scaleX as number }]
              }
            ]}
          >
            {enhancedChildren}
          </Animated.View>
        )}
      </ButtonInnerContainer>
    </AnimatedPressable>
  )
}

export default React.memo(Button)
