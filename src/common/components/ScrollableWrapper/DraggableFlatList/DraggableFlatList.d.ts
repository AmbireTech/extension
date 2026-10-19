import React from 'react'
import { FlatListProps, ScrollViewProps, StyleProp, ViewStyle } from 'react-native'

export type DraggableFlatListProps<T> = {
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
  // When provided, rows are positioned at this height instead of measured dynamically - one
  // for all of them, or one per row when they differ
  itemHeight?: number | ((item: T, index: number) => number)
  scrollableWrapperStyles?: ViewStyle
  contentContainerStyle?: StyleProp<ViewStyle>
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps']
  keyboardDismissMode?: ScrollViewProps['keyboardDismissMode']
} & Omit<FlatListProps<T>, 'renderItem' | 'data'>

declare const DraggableFlatList: <T>(
  props: DraggableFlatListProps<T> & React.RefAttributes<any>
) => React.ReactElement | null

export default DraggableFlatList
