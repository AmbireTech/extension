import React, { forwardRef, useCallback, useRef } from 'react'
import {
  FlatList,
  FlatListProps,
  Platform,
  ScrollViewProps,
  StyleProp,
  View,
  ViewStyle
} from 'react-native'

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import DraggableItem from './DraggableItem'

type DraggableFlatListProps<T> = {
  data: T[]
  keyExtractor: (item: T) => string
  renderItem: (
    item: T,
    index: number,
    isDragging: boolean,
    listeners: any,
    attributes: any
  ) => React.ReactNode
  onDragEnd: (fromIndex: number, toIndex: number) => void
  getItemLayout?: FlatListProps<T>['getItemLayout']
  scrollableWrapperStyles?: ViewStyle
  contentContainerStyle?: StyleProp<ViewStyle>

  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps']
  keyboardDismissMode?: ScrollViewProps['keyboardDismissMode']
} & Omit<FlatListProps<T>, 'renderItem' | 'data'>

const DraggableFlatList = forwardRef(
  <T,>(
    {
      data,
      keyExtractor,
      renderItem,
      onDragEnd,
      getItemLayout,
      scrollableWrapperStyles,
      contentContainerStyle,
      keyboardShouldPersistTaps,
      keyboardDismissMode,
      ...rest
    }: DraggableFlatListProps<T>,
    ref: any
  ) => {
    const flatListRef = useRef<any>(null)

    const sensors = useSensors(useSensor(PointerSensor))

    const handleDragEnd = useCallback(
      (event: any) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = data.findIndex((item) => keyExtractor(item) === active.id)
        const newIndex = data.findIndex((item) => keyExtractor(item) === over.id)

        onDragEnd(oldIndex, newIndex)
      },
      [data, keyExtractor, onDragEnd]
    )

    return (
      <View
        style={[
          { flex: 1, overflow: Platform.OS === 'web' ? 'hidden' : undefined },
          scrollableWrapperStyles
        ]}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={data.map(keyExtractor)} strategy={verticalListSortingStrategy}>
            <FlatList
              ref={(r) => {
                flatListRef.current = r
                if (typeof ref === 'function') ref(r)
                else if (ref) ref.current = r
              }}
              data={data}
              keyExtractor={keyExtractor}
              getItemLayout={getItemLayout}
              contentContainerStyle={contentContainerStyle}
              keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
              keyboardDismissMode={keyboardDismissMode || 'none'}
              alwaysBounceVertical={false}
              renderItem={({ item, index }) => (
                <DraggableItem key={keyExtractor(item)} id={keyExtractor(item)}>
                  {(isDragging, listeners, attributes) =>
                    renderItem(item, index, isDragging, listeners, attributes)
                  }
                </DraggableItem>
              )}
              scrollEnabled
              {...rest}
            />
          </SortableContext>
          <DragOverlay dropAnimation={null} />
        </DndContext>
      </View>
    )
  }
)

export default React.memo(DraggableFlatList)
