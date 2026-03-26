import React, { forwardRef } from 'react'
import {
  FlatList,
  FlatListProps,
  Platform,
  ScrollViewProps,
  StyleProp,
  View,
  ViewStyle
} from 'react-native'

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
    return (
      <View
        style={[
          { flex: 1, overflow: Platform.OS === 'web' ? 'hidden' : undefined },
          scrollableWrapperStyles
        ]}
      >
        <FlatList
          ref={ref}
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
      </View>
    )
  }
)

export default React.memo(DraggableFlatList)
