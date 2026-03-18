import React, { FC, useMemo } from 'react'
import { ViewStyle } from 'react-native'

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
}

const BannerButton: FC<Props> = ({ type, colorType, onPress, children, testID }) => {
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })

  const typeStyle: ViewStyle = useMemo(() => {
    if (type === 'primary') {
      return {
        backgroundColor: theme[`${colorType}Text`]
      }
    }

    return {
      borderWidth: 1,
      borderColor: theme[`${colorType}Text`]
    }
  }, [type, colorType, theme])

  return (
    <AnimatedPressable
      style={[
        typeStyle,
        {
          ...flexbox.center,
          ...flexbox.alignSelfStart,
          ...spacings.phSm,
          height: 30,
          borderRadius: BORDER_RADIUS_PRIMARY
        },
        animStyle
      ]}
      onPress={onPress}
      {...bindAnim}
      testID={testID}
    >
      <Text
        color={type === 'primary' ? theme.neutral100 : theme[`${colorType}Text`]}
        fontSize={14}
        weight="medium"
      >
        {children}
      </Text>
    </AnimatedPressable>
  )
}

export default BannerButton
