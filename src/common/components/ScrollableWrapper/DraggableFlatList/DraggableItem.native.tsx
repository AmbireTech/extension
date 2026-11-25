import React, { useMemo } from 'react'
import { useIsActive, useReorderableDrag } from 'react-native-reorderable-list'

import { DraggableItemProps } from './DraggableItem.d'

/** How long the handle has to be held before the row lifts, so a scroll that starts on it still scrolls */
const DRAG_HANDLE_LONG_PRESS_DELAY = 150

/**
 * A row of the native `DraggableFlatList`. `listeners` start the drag on a long press, so they
 * go on a pressable handle; `attributes` is empty, kept for the web's interface.
 */
const DraggableItem = ({ children }: Pick<DraggableItemProps, 'children'>) => {
  const drag = useReorderableDrag()
  const isDragging = useIsActive()

  const listeners = useMemo(
    () => ({ onLongPress: drag, delayLongPress: DRAG_HANDLE_LONG_PRESS_DELAY }),
    [drag]
  )
  const attributes = useMemo(() => ({}), [])

  return <>{children(isDragging, listeners, attributes)}</>
}

export default DraggableItem
