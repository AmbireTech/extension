import React, { forwardRef, useCallback, useEffect, useMemo } from 'react'
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
      itemHeight,
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

    // When the row heights are known (one for all of them, or one per row), use them for
    // deterministic positioning. Dynamic measurement is unreliable here (heights stay at the
    // estimate), which overlaps taller rows.
    const hasKnownItemHeight = itemHeight !== undefined

    // We use the hook directly to have more control over the FlatList props
    const {
      scrollViewRef,
      dropProviderRef,
      handleScroll,
      handleScrollEnd,
      contentHeight,
      getItemProps,
      positions
    } = useSortableList({
      data: sortableData as any,
      itemKeyExtractor: (item: any) => item.id,
      itemHeight,
      enableDynamicHeights: !hasKnownItemHeight,
      estimatedItemHeight: 72
    })

    /**
     * Where each row starts, when the rows differ in height. The library places a row once,
     * when it mounts, at its position times the height it is given - not at the sum of the
     * heights above it - and ignores the first update of the heights after that. So each
     * row is given the height that places it right, and is remounted when its place changes.
     */
    const rowLayouts = useMemo(() => {
      if (typeof itemHeight !== 'function') return null

      let top = 0
      return sortableData.map((item: any, index: number) => {
        const height = itemHeight(item, index)
        const rowLayout = { top, height }
        top += height
        return rowLayout
      })
    }, [itemHeight, sortableData])

    const dataOrderKey = useMemo(
      () => sortableData.map((item: any) => item.id).join('|'),
      [sortableData]
    )

    // react-native-reanimated-dnd seeds its positions map once, so a removed item leaves
    // the ones after it at their old offsets - a hole in the list. Re-seeding the map from
    // the current data order keeps the rows packed (the library's own Sortable component
    // achieves the same by remounting itself on every data change).
    useEffect(() => {
      positions.value = Object.fromEntries(
        sortableData.map((item: any, index: number) => [item.id, index])
      )
      // sortableData is intentionally left out - dataOrderKey already describes its changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataOrderKey, positions])

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
        const id = item.id
        const rowLayout = rowLayouts?.[index]
        const itemProps = {
          ...getItemProps(item, index),
          ...(rowLayout && {
            itemHeight: index ? rowLayout.top / index : rowLayout.height
          })
        }

        return (
          <DraggableItemInternalContext.Provider value={{ ...itemProps, item, onDrop: handleDrop }}>
            <DraggableItem key={rowLayout ? `${id}:${rowLayout.top}` : id} id={id}>
              {(isDragging, listeners, attributes) =>
                renderItem(item, index, isDragging, listeners, attributes)
              }
            </DraggableItem>
          </DraggableItemInternalContext.Provider>
        )
      },
      [getItemProps, renderItem, handleDrop, rowLayouts]
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
