import React from 'react'
import { ITooltip } from 'react-tooltip'

export type TooltipProps = ITooltip & {
  tooltipRef?: any
  withPortal?: boolean
  id: string
}

declare const Tooltip: React.FC<TooltipProps>

export default Tooltip
