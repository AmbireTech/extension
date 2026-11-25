import React, { forwardRef, useCallback } from 'react'
import { ListRenderItemInfo } from 'react-native'
import ReorderableList, { ReorderableListReorderEvent } from 'react-native-reorderable-list'

import { DraggableFlatListProps } from './DraggableFlatList.d'
import DraggableItem from './DraggableItem.native'

/**
 * A FlatList whose rows keep their place in the layout, so they are virtualized, measured
 * by their own height and packed again when one is removed. A drag starts from the element
 * a row spreads `listeners` on.
 */
const DraggableFlatList = forwardRef(
  <T,>(
    {
      data,
      keyExtractor,
      renderItem,
      onDragEnd,
      dragEnabled = true,
      keyboardShouldPersistTaps,
      keyboardDismissMode,
      ...rest
    }: DraggableFlatListProps<T>,
    ref: any
  ) => {
    const handleReorder = useCallback(
      ({ from, to }: ReorderableListReorderEvent) => onDragEnd(from, to),
      [onDragEnd]
    )

    const renderReorderableItem = useCallback(
      ({ item, index }: ListRenderItemInfo<T>) => (
        <DraggableItem>
          {(isDragging, listeners, attributes) =>
            renderItem(item, index, isDragging, listeners, attributes)
          }
        </DraggableItem>
      ),
      [renderItem]
    )

    return (
      <ReorderableList
        ref={ref}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderReorderableItem}
        onReorder={handleReorder}
        dragEnabled={dragEnabled}
        // Lets the dragged row's handle tell it is the one being dragged
        shouldUpdateActiveItem
        keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
        keyboardDismissMode={keyboardDismissMode || 'none'}
        {...rest}
      />
    )
  }
)

export default React.memo(DraggableFlatList)
