import React from 'react'
import { Pressable, View } from 'react-native'

import ArrowRightIcon from '@common/assets/svg/ArrowRightIcon'
import DeleteIcon from '@common/assets/svg/DeleteIcon'
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
  showTrash?: boolean
  onTrashPress?: () => void
}

const SectionHeader = ({ icon, title, onPress, showTrash, onTrashPress }: Props) => {
  const { theme } = useTheme()
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
        spacings.pvTy
      ]}
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
      {showTrash && onTrashPress && (
        <Pressable onPress={onTrashPress} hitSlop={8}>
          <DeleteIcon width={24} height={24} strokeWidth="1.75" />
        </Pressable>
      )}
    </View>
  )
}

export default React.memo(SectionHeader)
