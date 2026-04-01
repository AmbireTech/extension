import { useEffect } from 'react'

import { tooltipManager } from './TooltipManager'

import type { TooltipProps } from './Tooltip'

const Tooltip = ({ id, children }: TooltipProps) => {
  useEffect(() => {
    tooltipManager.register(id, children as any)
    return () => {
      tooltipManager.unregister(id)
    }
  }, [id, children])

  return null
}

export default Tooltip
