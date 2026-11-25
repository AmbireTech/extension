import React, { useCallback } from 'react'
import { GestureResponderEvent } from 'react-native'

import usePressedElementScreenPosition from '@common/components/BottomSheet/usePressedElementScreenPosition'

import { tooltipManager } from './TooltipManager'

type TooltipToShow = { id: string; content?: React.ReactNode; title?: string }

/**
 * Returns a press handler that opens the mobile tooltip next to the pressed element, which
 * must be the touch target (no child of it may take the touch) and not rotated or scaled.
 * `size` is the element's size.
 */
const useShowTooltipAtPress = () => {
  const getPressedElementScreenPosition = usePressedElementScreenPosition()

  return useCallback(
    (
      event: GestureResponderEvent,
      { id, content, title }: TooltipToShow,
      size: { width: number; height: number }
    ) => {
      // From the touch rather than `measure`, which can't tell where a native sheet is on screen
      tooltipManager.show(id, content, title, {
        ...getPressedElementScreenPosition(event),
        ...size
      })
    },
    [getPressedElementScreenPosition]
  )
}

export default useShowTooltipAtPress
