import { useCallback } from 'react'
import { GestureResponderEvent } from 'react-native'

import { useBottomSheet } from './BottomSheetContext'

/**
 * Returns a function that gives the screen position of the top-left corner of a pressed element
 * on mobile, from the press event. Unlike `measure`, it is right inside a native sheet too. The
 * element must be the touch target (no child of it may take the touch) and not rotated or scaled.
 */
const usePressedElementScreenPosition = () => {
  const { screenOffsetRef } = useBottomSheet()

  return useCallback(
    ({ nativeEvent }: GestureResponderEvent) => {
      // In a sheet the touch is relative to the sheet, so its position is added
      const sheetOffset = screenOffsetRef?.current

      return {
        x: nativeEvent.pageX - nativeEvent.locationX + (sheetOffset?.x ?? 0),
        y: nativeEvent.pageY - nativeEvent.locationY + (sheetOffset?.y ?? 0)
      }
    },
    [screenOffsetRef]
  )
}

export default usePressedElementScreenPosition
