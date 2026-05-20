import React from 'react'
import { Pressable, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import DeleteIcon from '@common/assets/svg/DeleteIcon'
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

const ChevronRight = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M6 4l4 4-4 4"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

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
        spacings.ph,
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
        <View style={spacings.mlMi}>
          <ChevronRight color={theme.iconPrimary as string} />
        </View>
      </AnimatedPressable>
      {showTrash && onTrashPress && (
        <Pressable
          onPress={onTrashPress}
          hitSlop={8}
          style={[flexbox.center, { width: 32, height: 32 }]}
        >
          <DeleteIcon width={22} height={22} />
        </Pressable>
      )}
    </View>
  )
}

export default React.memo(SectionHeader)
