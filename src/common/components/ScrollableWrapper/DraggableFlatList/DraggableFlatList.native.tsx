import React, { forwardRef, useCallback, useMemo } from 'react'
import { FlatList, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { DropProvider, useSortableList } from 'react-native-reanimated-dnd'

import flexbox from '@common/styles/utils/flexbox'

import { DraggableFlatListProps } from './DraggableFlatList.d'
import DraggableItem from './DraggableItem'
import { DraggableItemInternalContext } from './DraggableItemInternalContext'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

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
    // react-native-reanimated-dnd requires items to have an 'id' property for positioning.
    const sortableData = useMemo(
      () =>
        data.map((item) => ({
          ...item,
          id: keyExtractor(item)
        })),
      [data, keyExtractor]
    )

    // We use the hook directly to have more control over the FlatList props
    const {
      scrollViewRef,
      dropProviderRef,
      handleScroll,
      handleScrollEnd,
      contentHeight,
      getItemProps
    } = useSortableList({
      data: sortableData as any,
      itemKeyExtractor: (item: any) => item.id,
      enableDynamicHeights: true, // Default to dynamic heights
      estimatedItemHeight: 72
    })

    const handleDrop = useCallback(
      (id: string, position: number) => {
        const oldIndex = data.findIndex((item) => keyExtractor(item) === id)
        if (oldIndex !== -1 && oldIndex !== position) {
          onDragEnd(oldIndex, position)
        }
      },
      [data, keyExtractor, onDragEnd]
    )

    const memoizedRenderItem = useCallback(
      ({ item, index }: { item: any; index: number }) => {
        const itemProps = getItemProps(item, index)
        const id = item.id

        return (
          <DraggableItemInternalContext.Provider value={{ ...itemProps, item, onDrop: handleDrop }}>
            <DraggableItem key={id} id={id}>
              {(isDragging, listeners, attributes) =>
                renderItem(item, index, isDragging, listeners, attributes)
              }
            </DraggableItem>
          </DraggableItemInternalContext.Provider>
        )
      },
      [getItemProps, renderItem, handleDrop]
    )

    return (
      <GestureHandlerRootView style={[flexbox.flex1, scrollableWrapperStyles]}>
        <DropProvider ref={dropProviderRef}>
          <AnimatedFlatList
            //@ts-ignore
            ref={(r: any) => {
              if (scrollViewRef) {
                if (typeof scrollViewRef === 'function') scrollViewRef(r)
                //@ts-ignore
                else if (scrollViewRef.current !== undefined) scrollViewRef.current = r
              }
              if (typeof ref === 'function') ref(r)
              else if (ref) ref.current = r
            }}
            data={sortableData as any}
            keyExtractor={(item: any) => item.id}
            renderItem={memoizedRenderItem as any}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={[contentContainerStyle, { minHeight: contentHeight }]}
            onScrollEndDrag={handleScrollEnd}
            onMomentumScrollEnd={handleScrollEnd}
            simultaneousHandlers={dropProviderRef}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
            keyboardDismissMode={keyboardDismissMode || 'none'}
            {...Object.fromEntries(Object.entries(rest).filter(([k]) => k !== 'itemHeight'))}
          />
        </DropProvider>
      </GestureHandlerRootView>
    )
  }
)

export default React.memo(DraggableFlatList)
