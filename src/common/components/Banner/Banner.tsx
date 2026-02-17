import React, { useMemo } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'

import { BannerType } from '@ambire-common/interfaces/banner'
import CloseIcon from '@common/assets/svg/CloseIcon'
import ErrorIcon from '@common/assets/svg/ErrorIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'

import getStyles from './styles'

const ICON_MAP: {
  [key in BannerType]: React.FC<any>
} = {
  error: ErrorIcon,
  warning: WarningIcon,
  success: SuccessIcon,
  info: InfoIcon
}

export interface Props {
  title: string
  type: BannerType
  text?: string
  children?: React.ReactNode | React.ReactNode[]
  CustomIcon?: React.FC<any> | null
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
  titleFontSize?: number
  onPress?: () => void
  onClosePress?: () => void
}

const Banner = React.memo(
  ({
    type,
    title,
    text,
    children,
    CustomIcon,
    titleFontSize,
    style,
    onClosePress,
    onPress
  }: Props) => {
    const { styles, theme } = useTheme(getStyles)
    const [bindAnim, animStyle] = useCustomHover({
      property: 'borderColor',
      values: {
        from: hexToRgba(theme[`${type}Text`], 0),
        to: hexToRgba(theme[`${type}Text`], 1)
      }
    })

    const WrapperElement = onPress ? AnimatedPressable : View
    const Icon = useMemo(() => {
      if (CustomIcon) return CustomIcon

      return ICON_MAP[type]
    }, [CustomIcon, type])

    return (
      <WrapperElement
        style={[
          styles.container,
          flexbox.alignStart,
          {
            backgroundColor: theme[`${type}Background`],
            borderWidth: 1,
            borderColor: !onPress ? 'transparent' : animStyle.borderColor
          },
          style
        ]}
        {...(onPress ? { ...bindAnim, onPress } : {})}
        testID={`dashboard-${type}-banner`}
      >
        <View style={[spacings.mrMi, { marginTop: 1 }]}>
          <Icon width={24} height={24} color={theme[`${type}Text`]} />
        </View>

        <View style={[flexbox.wrap, flexbox.flex1]}>
          <Text appearance={`${type}Text`} fontSize={titleFontSize || 16} weight="medium">
            {title}
          </Text>
          {!!text && (
            <Text fontSize={14} weight="regular" appearance={`${type}Text`}>
              {text}
            </Text>
          )}
        </View>
        {!!onClosePress && (
          <Pressable
            onPress={onClosePress}
            hitSlop={8}
            style={{
              width: 24,
              height: 24,
              ...flexbox.center
            }}
            testID="banner-button-reject"
          >
            <CloseIcon color={theme.iconPrimary} strokeWidth="2" width={12} height={12} />
          </Pressable>
        )}
        {children}
      </WrapperElement>
    )
  }
)

export default Banner
