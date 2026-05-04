import React from 'react'
import {
  FlatList,
  FlatListProps,
  ScrollView,
  ScrollViewProps,
  SectionList,
  SectionListProps,
  StyleProp,
  View,
  ViewStyle
} from 'react-native'

import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'

import DraggableFlatList from './DraggableFlatList'
import createStyles from './styles'

export enum WRAPPER_TYPES {
  SCROLL_VIEW = 'scrollview',
  KEYBOARD_AWARE_SCROLL_VIEW = 'keyboard-aware-scrollview',
  FLAT_LIST = 'flatlist',
  SECTION_LIST = 'sectionlist',
  VIEW = 'view',
  DRAGGABLE_FLAT_LIST = 'draggable-flatlist'
}

type BaseProps = {
  type?: WRAPPER_TYPES
  wrapperRef?: any
  extraHeight?: number
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}

type FlatListCompatibleProps<T = any> = Partial<FlatListProps<T>>
type SectionListCompatibleProps<T = any> = Partial<SectionListProps<T, any>>

export type WrapperProps<T = any> = BaseProps &
  ScrollViewProps &
  FlatListCompatibleProps<T> &
  SectionListCompatibleProps<T> & {
    children?: React.ReactNode
    onDragEnd?: (fromIndex: number, toIndex: number) => void
    renderItem?: (
      item: T,
      index: number,
      isDragging: boolean,
      listeners: any,
      attributes: any
    ) => React.ReactElement | null
    keyExtractor?: (item: T, index: number) => string
    data?: T[]
  }

const ScrollableWrapper = ({
  style = {},
  contentContainerStyle = {},
  children,
  type = WRAPPER_TYPES.SCROLL_VIEW,
  keyboardShouldPersistTaps,
  keyboardDismissMode,
  extraHeight,
  wrapperRef,
  onDragEnd,
  renderItem,
  keyExtractor,
  data,
  showsVerticalScrollIndicator = isWeb,
  ...rest
}: WrapperProps) => {
  const { styles } = useTheme(createStyles)
  const scrollableWrapperStyles = [styles.wrapper, ...(Array.isArray(style) ? style : [style])]

  const scrollableWrapperContentContainerStyles: StyleProp<ViewStyle> = [
    styles.contentContainerStyle,
    ...(Array.isArray(contentContainerStyle) ? contentContainerStyle : [contentContainerStyle]),
    isWeb ? ({ overflowY: 'auto' } as any) : null
  ]

  if (type === WRAPPER_TYPES.DRAGGABLE_FLAT_LIST) {
    return (
      <DraggableFlatList
        ref={wrapperRef}
        bounces={isMobile}
        data={data}
        keyExtractor={
          keyExtractor ? (item: any) => keyExtractor(item, 0) : (item: any) => item.key ?? ''
        }
        onDragEnd={onDragEnd ?? (() => {})}
        renderItem={renderItem ?? (() => null)}
        style={scrollableWrapperStyles}
        contentContainerStyle={scrollableWrapperContentContainerStyles}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
        keyboardDismissMode={keyboardDismissMode || 'none'}
        {...rest}
      />
    )
  }

  if (type === WRAPPER_TYPES.FLAT_LIST) {
    return (
      <FlatList
        ref={wrapperRef}
        bounces={isMobile}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor || ((item, index) => item.key ?? index.toString())}
        style={scrollableWrapperStyles}
        contentContainerStyle={scrollableWrapperContentContainerStyles}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
        keyboardDismissMode={keyboardDismissMode || 'none'}
        alwaysBounceVertical={false}
        {...rest}
      />
    )
  }

  if (type === WRAPPER_TYPES.SECTION_LIST) {
    return (
      <SectionList
        ref={wrapperRef}
        bounces={isMobile}
        sections={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor || ((item, index) => item.key ?? index.toString())}
        style={scrollableWrapperStyles}
        contentContainerStyle={scrollableWrapperContentContainerStyles}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
        keyboardDismissMode={keyboardDismissMode || 'none'}
        alwaysBounceVertical={false}
        {...rest}
      />
    )
  }

  if (type === WRAPPER_TYPES.VIEW) {
    return <View style={style}>{children}</View>
  }

  return (
    <ScrollView
      ref={wrapperRef}
      bounces={isMobile}
      style={scrollableWrapperStyles}
      contentContainerStyle={scrollableWrapperContentContainerStyles}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
      keyboardDismissMode={keyboardDismissMode || 'none'}
      alwaysBounceVertical={false}
      {...rest}
    >
      {children}
    </ScrollView>
  )
}

export default ScrollableWrapper
