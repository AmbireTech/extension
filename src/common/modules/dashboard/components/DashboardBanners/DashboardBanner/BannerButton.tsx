import React, { FC, useMemo } from 'react'
import { ColorValue, PressableProps, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  type: 'primary' | 'secondary'
  colorType: 'error' | 'warning' | 'info' | 'success'
  onPress: () => void
  children: React.ReactNode
  testID?: string
  /** Overrides the color that `colorType` resolves to, e.g. for banners in the brand accent */
  accentColor?: ColorValue
} & Partial<PressableProps>

const BannerButton: FC<Props> = ({
  type,
  colorType,
  onPress,
  children,
  testID,
  accentColor,
  ...rest
}) => {
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })
  const color = accentColor || theme[`${colorType}Text`]
  // The accent is a bright purple in both themes, so its text has to stay light in both
  const primaryTextColor = accentColor ? theme.neutral200 : theme.neutral100

  const typeStyle: ViewStyle = useMemo(() => {
    if (type === 'primary') {
      return {
        backgroundColor: color
      }
    }

    return {
      borderWidth: 1,
      borderColor: color
    }
  }, [type, color])

  return (
    <AnimatedPressable
      {...rest}
      style={[
        typeStyle,
        {
          ...flexbox.center,
          ...spacings.phSm,
          height: 30,
          borderRadius: BORDER_RADIUS_PRIMARY
        },
        animStyle,
        rest?.style as ViewStyle
      ]}
      onPress={onPress}
      testID={testID}
      {...bindAnim}
    >
      <Text color={type === 'primary' ? primaryTextColor : color} fontSize={14} weight="medium">
        {children}
      </Text>
    </AnimatedPressable>
  )
}

export default BannerButton
