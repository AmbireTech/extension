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
  scrollableWrapperStyles?: ViewStyle
  contentContainerStyle?: StyleProp<ViewStyle>
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps']
  keyboardDismissMode?: ScrollViewProps['keyboardDismissMode']
} & Omit<FlatListProps<T>, 'renderItem' | 'data'>

declare const DraggableFlatList: <T>(
  props: DraggableFlatListProps<T> & React.RefAttributes<any>
) => React.ReactElement | null

export default DraggableFlatList
