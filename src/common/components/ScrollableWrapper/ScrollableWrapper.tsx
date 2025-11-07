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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { isWeb } from '@common/config/env'
import { TAB_BAR_HEIGHT } from '@common/constants/router'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

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
  hasBottomTabNav?: boolean
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
  hasBottomTabNav: _hasBottomTabNav,
  extraHeight,
  wrapperRef,
  onDragEnd,
  renderItem,
  keyExtractor,
  data,
  ...rest
}: WrapperProps) => {
  const { styles } = useTheme(createStyles)
  const insets = useSafeAreaInsets()

  const horizontalSpacing = isWeb ? spacings.ph0 : spacings.ph
  const hasBottomTabNav = isWeb ? false : _hasBottomTabNav

  const scrollableWrapperStyles = [
    styles.wrapper,
    horizontalSpacing,
    ...(Array.isArray(style) ? style : [style])
  ]

  const scrollableWrapperContentContainerStyles: StyleProp<ViewStyle> = [
    styles.contentContainerStyle,
    !!hasBottomTabNav && { paddingBottom: TAB_BAR_HEIGHT + insets.bottom },
    ...(Array.isArray(contentContainerStyle) ? contentContainerStyle : [contentContainerStyle]),
    isWeb ? ({ overflowY: 'auto' } as any) : null
  ]

  if (type === WRAPPER_TYPES.DRAGGABLE_FLAT_LIST) {
    return (
      <DraggableFlatList
        ref={wrapperRef}
        data={data}
        keyExtractor={
          keyExtractor ? (item: any) => keyExtractor(item, 0) : (item: any) => item.key ?? ''
        }
        onDragEnd={onDragEnd ?? (() => {})}
        renderItem={renderItem ?? (() => null)}
        style={scrollableWrapperStyles}
        contentContainerStyle={scrollableWrapperContentContainerStyles}
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
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor || ((item, index) => item.key ?? index.toString())}
        style={scrollableWrapperStyles}
        contentContainerStyle={scrollableWrapperContentContainerStyles}
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
        sections={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor || ((item, index) => item.key ?? index.toString())}
        style={scrollableWrapperStyles}
        contentContainerStyle={scrollableWrapperContentContainerStyles}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
        keyboardDismissMode={keyboardDismissMode || 'none'}
        alwaysBounceVertical={false}
        {...rest}
      />
    )
  }

  if (type === WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW) {
    return (
      <KeyboardAwareScrollView
        ref={wrapperRef}
        style={scrollableWrapperStyles}
        contentContainerStyle={scrollableWrapperContentContainerStyles}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
        keyboardDismissMode={keyboardDismissMode || 'none'}
        alwaysBounceVertical={false}
        // Glitchy on Android, even without `extraScrollHeight` and
        // `extraHeight` props set.
        // TODO: Find a better package, that supports Android better.
        enableOnAndroid={false}
        keyboardOpeningTime={100}
        extraScrollHeight={hasBottomTabNav ? -TAB_BAR_HEIGHT : 0}
        // Adds extra offset between the keyboard and the focused input
        extraHeight={extraHeight || 75}
        {...rest}
      >
        {children}
      </KeyboardAwareScrollView>
    )
  }

  if (type === WRAPPER_TYPES.VIEW) {
    return <View style={style}>{children}</View>
  }

  return (
    <ScrollView
      ref={wrapperRef}
      style={scrollableWrapperStyles}
      contentContainerStyle={scrollableWrapperContentContainerStyles}
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
