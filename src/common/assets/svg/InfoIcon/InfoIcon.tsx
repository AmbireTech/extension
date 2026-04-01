import React from 'react'
import { Pressable } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import { LegendsSvgProps } from '@legends/types/svg'

import { tooltipManager } from '@common/components/Tooltip/TooltipManager'

const InfoIcon: React.FC<LegendsSvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  const tooltipData = React.useMemo(() => {
    if (rest['data-tooltip-id']) return { id: rest['data-tooltip-id'] }
    if (rest.dataSet && rest.dataSet.tooltip) {
      try {
        const data = JSON.parse(rest.dataSet.tooltip)
        return { id: data.id, content: data.content || data.children }
      } catch (e) {
        return null
      }
    }
    return null
  }, [rest])

  const icon = (
    <Svg width={width} height={height} viewBox="0 0 16 16" fill="none" {...rest}>
      <Circle cx="8" cy="8" r="6" stroke={color || theme.iconPrimary} />
      <Path
        fill={color || theme.iconPrimary}
        stroke={color || theme.iconPrimary}
        d="M8.333 5a.333.333 0 1 1-.666 0 .333.333 0 0 1 .666 0Z"
      />
      <Path stroke={color || theme.iconPrimary} d="M8 11.333V6.667" />
    </Svg>
  )

  if (isMobile && tooltipData?.id) {
    return (
      <Pressable onPress={() => tooltipManager.show(tooltipData.id, tooltipData.content)}>
        {icon}
      </Pressable>
    )
  }

  return icon
}

export default React.memo(InfoIcon)
