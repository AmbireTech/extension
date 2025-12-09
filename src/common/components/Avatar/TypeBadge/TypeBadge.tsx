import { nanoid } from 'nanoid'
import React, { FC } from 'react'
import { View } from 'react-native'

import BADGE_PRESETS from '@common/components/BadgeWithPreset/presets'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MI } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'

interface Props {
  isSmart: boolean
  size?: 'big' | 'small'
  showTooltip?: boolean
}

const TypeBadge: FC<Props> = ({ isSmart, size, showTooltip = false }) => {
  const { theme, themeType } = useTheme()
  const badgePreset = BADGE_PRESETS['smart-account']
  const tooltipId = nanoid(6)

  return isSmart ? (
    <View
      // @ts-ignore
      dataSet={createGlobalTooltipDataSet({
        id: tooltipId,
        content: badgePreset.tooltipText,
        hidden: !showTooltip
      })}
      style={{
        position: 'absolute',
        left: size === 'big' ? -SPACING_MI / 2 : -SPACING_MI,
        top: size === 'big' ? -SPACING_MI / 2 : -SPACING_MI,
        paddingHorizontal: 3,
        paddingVertical: 2,
        backgroundColor: theme.successDecorative,
        zIndex: 2,
        borderRadius: 50,
        borderWidth: size === 'big' ? 3 : 2,
        borderColor:
          themeType === THEME_TYPES.DARK ? theme.secondaryBackground : theme.primaryBackground
      }}
    >
      <Text color={theme.primaryBackground} weight="semiBold" fontSize={size === 'big' ? 10 : 9}>
        SA
      </Text>
    </View>
  ) : null
}

export default React.memo(TypeBadge)
