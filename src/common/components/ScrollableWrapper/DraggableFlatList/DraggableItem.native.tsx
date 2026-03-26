import React, { useCallback, useContext, useMemo, useState } from 'react'
import { SortableItem } from 'react-native-reanimated-dnd'

import { DraggableItemProps } from './DraggableItem.d'
import { DraggableItemInternalContext } from './DraggableItemInternalContext'

/**
 * DraggableItem component for Native (Mobile).
 * Wraps SortableItem from react-native-reanimated-dnd.
 *
 * Note: On Native, listeners and attributes are currently empty objects to match the interface.
 * react-native-reanimated-dnd handles the whole item as a drag handle by default.
 * To use a specific portion as a handle, use SortableItem.Handle within the children.
 */
const DraggableItem = ({ id, children }: DraggableItemProps) => {
  const contextProps = useContext(DraggableItemInternalContext)
  const [isCurrentlyDragging, setIsCurrentlyDragging] = useState(false)

  const handleDragStart = useCallback(() => {
    setIsCurrentlyDragging(true)
  }, [])

  const handleDrop = useCallback(
    (itemId: string, position: number, allPositions: any) => {
      setIsCurrentlyDragging(false)
      if (contextProps?.onDrop) {
        contextProps.onDrop(itemId, position, allPositions)
      }
    },
    [contextProps]
  )

  const sortableProps = useMemo(
    () => ({
      ...contextProps,
      id,
      onDragStart: handleDragStart,
      onDrop: handleDrop,
      data: contextProps?.item // SortableItem expects item data
    }),
    [contextProps, id, handleDragStart, handleDrop]
  )

  // Spreadable listeners and attributes for consistency with web interface
  const listeners = useMemo(() => ({}), [])
  const attributes = useMemo(() => ({}), [])

  return (
    <SortableItem {...sortableProps}>
      {children(isCurrentlyDragging, listeners, attributes)}
    </SortableItem>
  )
}

export default React.memo(DraggableItem)
