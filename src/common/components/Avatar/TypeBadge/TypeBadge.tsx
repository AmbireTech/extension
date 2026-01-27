import { nanoid } from 'nanoid'
import React, { FC } from 'react'
import { View } from 'react-native'

import SafeIcon from '@common/assets/svg/SafeIcon'
import BADGE_PRESETS from '@common/components/BadgeWithPreset/presets'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MI } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'

interface Props {
  smartAccountType?: 'Ambire' | 'Safe'
  size?: 'big' | 'small'
  showTooltip?: boolean
}

const TypeBadge: FC<Props> = ({ smartAccountType, size, showTooltip = false }) => {
  const { theme, themeType } = useTheme()
  const badgePreset = BADGE_PRESETS['smart-account']
  const tooltipId = nanoid(6)

  if (!smartAccountType) return null

  if (smartAccountType === 'Ambire') {
    return (
      <View
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
    )
  }

  return (
    <SafeIcon
      dataSet={createGlobalTooltipDataSet({
        id: tooltipId,
        content: badgePreset.tooltipText,
        hidden: !showTooltip
      })}
      width={size === 'big' ? 21 : 15}
      height={size === 'big' ? 21 : 15}
      style={{
        position: 'absolute',
        left: size === 'big' ? -3 : -SPACING_MI,
        top: size === 'big' ? -4 : -SPACING_MI,
        paddingHorizontal: 3,
        paddingVertical: 2,
        zIndex: 2
      }}
    />
  )
}

export default React.memo(TypeBadge)
