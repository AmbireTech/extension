import React, { useCallback } from 'react'
import { GestureResponderEvent } from 'react-native'

import { useBottomSheet } from '@common/components/BottomSheet/BottomSheetContext'

import { tooltipManager } from './TooltipManager'

type TooltipToShow = { id: string; content?: React.ReactNode; title?: string }

/**
 * Returns a press handler that opens the mobile tooltip next to the pressed element, which
 * must be the touch target (no child of it may take the touch) and not rotated or scaled.
 * `size` is the element's size.
 */
const useShowTooltipAtPress = () => {
  const { screenOffsetRef } = useBottomSheet()

  return useCallback(
    (
      { nativeEvent }: GestureResponderEvent,
      { id, content, title }: TooltipToShow,
      size: { width: number; height: number }
    ) => {
      // From the touch rather than `measure`, which can't tell where a native sheet is on
      // screen. In a sheet the touch is relative to the sheet, so its position is added
      const sheetOffset = screenOffsetRef?.current
      tooltipManager.show(id, content, title, {
        x: nativeEvent.pageX - nativeEvent.locationX + (sheetOffset?.x ?? 0),
        y: nativeEvent.pageY - nativeEvent.locationY + (sheetOffset?.y ?? 0),
        ...size
      })
    },
    [screenOffsetRef]
  )
}

export default useShowTooltipAtPress
