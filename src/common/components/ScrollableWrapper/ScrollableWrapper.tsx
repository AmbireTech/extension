import React, { useCallback, useRef, useState } from 'react'
import {
  Dimensions,
  FlatList,
  FlatListProps,
  LayoutChangeEvent,
  ScrollView,
  ScrollViewProps,
  SectionList,
  SectionListProps,
  StyleProp,
  View,
  ViewStyle
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
  const insets = useSafeAreaInsets()
  const internalRef = useRef<any>(null)
  const [isAtScreenBottom, setIsAtScreenBottom] = useState<boolean>(isMobile)

  const setRefs = useCallback(
    (node: any) => {
      internalRef.current = node
      if (typeof wrapperRef === 'function') wrapperRef(node)
      else if (wrapperRef && 'current' in wrapperRef) wrapperRef.current = node
    },
    [wrapperRef]
  )

  const handleLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      if (!isMobile) return
      const node = internalRef.current
      const measurable =
        node && typeof node.measureInWindow === 'function'
          ? node
          : node && typeof node.getNativeScrollRef === 'function'
            ? node.getNativeScrollRef()
            : node && typeof node.getScrollResponder === 'function'
              ? node.getScrollResponder()
              : null

      // eslint-disable-next-line no-console
      console.log('[ScrollableWrapper] handleLayout', {
        type,
        hasNode: !!node,
        hasMeasurable: !!(measurable && typeof measurable.measureInWindow === 'function')
      })

      if (!measurable || typeof measurable.measureInWindow !== 'function') return

      measurable.measureInWindow((_x: number, y: number, _w: number, height: number) => {
        const windowHeight = Dimensions.get('window').height
        const atBottom = y + height >= windowHeight - insets.bottom - 1
        // eslint-disable-next-line no-console
        console.log('[ScrollableWrapper] measureInWindow result', {
          type,
          y,
          height,
          bottomY: y + height,
          windowHeight,
          insetsBottom: insets.bottom,
          diffFromWindow: windowHeight - (y + height),
          diffFromWindowMinusInset: windowHeight - insets.bottom - (y + height),
          atBottom
        })
        setIsAtScreenBottom(atBottom)
      })
    },
    [type, insets.bottom]
  )

  const shouldApplyBottomInset = isMobile && isAtScreenBottom
  // eslint-disable-next-line no-console
  console.log('[ScrollableWrapper] render', {
    type,
    isMobile,
    isAtScreenBottom,
    shouldApplyBottomInset,
    insetsBottom: insets.bottom,
    appliedPaddingBottom: shouldApplyBottomInset ? insets.bottom : 0
  })
  const scrollableWrapperStyles = [
    styles.wrapper,
    ...(Array.isArray(style) ? style : [style])
  ]
  const scrollableWrapperContentContainerStyles: StyleProp<ViewStyle> = [
    { paddingBottom: shouldApplyBottomInset ? insets.bottom : 0 },
    styles.contentContainerStyle,
    ...(Array.isArray(contentContainerStyle) ? contentContainerStyle : [contentContainerStyle]),
    isWeb ? ({ overflowY: 'auto' } as any) : null
  ]

  const { onLayout: consumerOnLayout, ...restWithoutOnLayout } = rest as any
  const composedOnLayout = (event: LayoutChangeEvent) => {
    handleLayout(event)
    if (consumerOnLayout) consumerOnLayout(event)
  }

  if (type === WRAPPER_TYPES.DRAGGABLE_FLAT_LIST) {
    return (
      <DraggableFlatList
        ref={setRefs}
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
        onLayout={composedOnLayout}
        {...restWithoutOnLayout}
      />
    )
  }

  if (type === WRAPPER_TYPES.FLAT_LIST) {
    return (
      <FlatList
        ref={setRefs}
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
        onLayout={composedOnLayout}
        {...restWithoutOnLayout}
      />
    )
  }

  if (type === WRAPPER_TYPES.SECTION_LIST) {
    return (
      <SectionList
        ref={setRefs}
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
        onLayout={composedOnLayout}
        {...restWithoutOnLayout}
      />
    )
  }

  if (type === WRAPPER_TYPES.VIEW) {
    return <View style={style}>{children}</View>
  }

  return (
    <ScrollView
      ref={setRefs}
      bounces={isMobile}
      style={scrollableWrapperStyles}
      contentContainerStyle={scrollableWrapperContentContainerStyles}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps || 'handled'}
      keyboardDismissMode={keyboardDismissMode || 'none'}
      alwaysBounceVertical={false}
      onLayout={composedOnLayout}
      {...restWithoutOnLayout}
    >
      {children}
    </ScrollView>
  )
}

export default ScrollableWrapper
