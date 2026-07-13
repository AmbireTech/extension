import React, { useState } from 'react'
import { Pressable, View } from 'react-native'

import ArrowRightIcon from '@common/assets/svg/ArrowRightIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Text from '@common/components/Text'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  icon: React.ReactNode
  title: string
  onPress: () => void
  // Icon-button revealed on hover (e.g. clear recents, disconnect connected apps)
  actionIcon?: React.ReactNode
  onActionPress?: () => void
}

const SectionHeader = ({ icon, title, onPress, actionIcon, onActionPress }: Props) => {
  const { theme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [bindAnim, animStyle] = useCustomHover({
    property: 'opacity',
    values: { from: 1, to: 0.7 }
  })

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.pvSm
      ]}
      {...({
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false)
      } as any)}
    >
      <AnimatedPressable
        {...bindAnim}
        onPress={onPress}
        style={[flexbox.directionRow, flexbox.alignCenter, animStyle, flexbox.flex1]}
      >
        {icon}
        <Text
          weight="semiBold"
          fontSize={16}
          appearance="primaryText"
          style={{ marginLeft: SPACING_TY }}
        >
          {title}
        </Text>

        <RightArrowIcon style={spacings.mlSm} />
      </AnimatedPressable>
      {actionIcon && onActionPress && isHovered && (
        <Pressable onPress={onActionPress} hitSlop={8}>
          {actionIcon}
        </Pressable>
      )}
    </View>
  )
}

export default React.memo(SectionHeader)
