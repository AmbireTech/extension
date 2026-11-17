import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  FlatListProps,
  LayoutChangeEvent,
  ScrollView,
  ScrollViewProps,
  SectionList,
  SectionListProps,
  View
} from 'react-native'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardController } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { captureException } from '@common/config/analytics/CrashAnalytics'
import { isiOS } from '@common/config/env'
import useLatestCallback from '@common/hooks/useLatestCallback'
import useTheme from '@common/hooks/useTheme'
import {
  DEVICE_HEIGHT,
  SPACING_LG,
  SPACING_MD,
  SPACING_SM,
  SPACING_XL
} from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { Portal, PortalHost } from '@gorhom/portal'
import { SheetDetent, TrueSheet } from '@lodev09/react-native-true-sheet'

import { BottomSheetProps } from './BottomSheet'
import { BottomSheetContext, useBottomSheetContextValue } from './BottomSheetContext'
import IS_SHEET_HEADER_FLOATING from './isSheetHeaderFloating'
import SheetHeaderBlur from './SheetHeaderBlur/SheetHeaderBlur'
import { SheetSectionHeaderGlassContext } from './SheetStickyHeader/SheetSectionHeaderGlassContext'
import SheetStickyHeader, {
  SheetStickyHeaderLayout,
  SheetStickyHeaderLayoutContext
} from './SheetStickyHeader/SheetStickyHeader'
import useBottomSheetInternal from './useBottomSheetInternal'

/**
 * The subset of the Modalize ref API that callers use (via `useModalize`), so the
 * call sites keep working unchanged on top of TrueSheet.
 */
type SheetRefAdapter = {
  open: () => void
  close: () => void
}

const AUTO_DETENTS: SheetDetent[] = ['auto']
const IOS_DIM_COLOR = '#0D0E0F'
const IOS_DIM_OPACITY = { [THEME_TYPES.LIGHT]: 0.52, [THEME_TYPES.DARK]: 0.65 }
const FULL_HEIGHT_DETENTS: SheetDetent[] = [1]
const ABSOLUTE_HEADER_OPTIONS = { position: 'absolute' as const }
const HEADER_COMPONENT_GAP_STYLE = { marginTop: SPACING_SM }
const FLEX_STYLE = { flex: 1 }
/**
 * Where the content starts below the native grabber, which overlays the top of the sheet:
 * it ends ~10pt down on iOS (5pt margin + 5pt pill) and ~20dp on Android (16dp + 4dp)
 */
const BELOW_GRABBER_PADDING = isiOS ? SPACING_MD : SPACING_XL
// Shared defaults, as a new `{}` per render would defeat the memoization below
const EMPTY_STYLE = {}
// Content sized to fit may still shrink: under a header that isn't floating, a list taller than
// the sheet then ends at its bottom edge, instead of below it out of reach of the scroll
const FLEX_GROW_STYLE = { flexGrow: 1, flexShrink: 1 }
const FLEX_SHRINK_STYLE = { flexShrink: 1 }
/**
 * iOS 26 floats a sheet up to 100pt tall well inside the screen's edges and widens a taller one,
 * so a short sheet changed width as its content loaded. Sheets sized to fit start above that
 * (`TrueSheetFloatingDetentMaxHeight` in TrueSheet)
 */
const IOS_FLOATING_SHEET_MAX_HEIGHT = 100
// On the content's child: TrueSheet measures the fit height with the content view's own min
// and max height replaced by its constraints
const FIT_CONTENT_ROOT_STYLE =
  isiOS && isLiquidGlassAvailable()
    ? { ...FLEX_GROW_STYLE, minHeight: IOS_FLOATING_SHEET_MAX_HEIGHT + 1 }
    : FLEX_GROW_STYLE

const noop = () => {}

const reportSheetError = (error: unknown) => {
  console.error('BottomSheet: opening or closing the sheet failed', error)
  captureException(error)
}

/**
 * Presents the sheet after the commit that carries the measured header into the portaled sheet,
 * so it opens straight to its final height. Placed after TrueSheet, whose ref is attached by then.
 */
const SheetPresentTrigger = ({
  requestId,
  onRequest
}: {
  requestId: number
  onRequest: () => void
}) => {
  useLayoutEffect(() => {
    if (requestId) onRequest()
    // Only a new request presents, not a new callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  return null
}

/**
 * The value from before `isFrozen` turned on, for as long as it stays on, then the current one again.
 */
const useFrozenWhile = <T,>(value: T, isFrozen: boolean): T => {
  const [frozenValue, setFrozenValue] = useState(value)
  if (!isFrozen && frozenValue !== value) setFrozenValue(value)

  return isFrozen ? frozenValue : value
}

const BottomSheet: React.FC<BottomSheetProps> = (props: BottomSheetProps) => {
  const {
    scrollViewRef: externalScrollViewRef,
    children,
    closeBottomSheet: _closeBottomSheet = noop,
    adjustToContentHeight = true,
    modalHeight,
    style = EMPTY_STYLE,
    containerInnerWrapperStyles = EMPTY_STYLE,
    onClosed: _onClosed,
    onOpened: _onOpened,
    onOpen: _onOpen,
    onBackdropPress: _onBackdropPress,
    HeaderComponent,
    FooterComponent,
    flatListProps,
    sectionListProps,
    scrollViewProps,
    backgroundColor = 'primaryBackground',
    shouldBeClosableOnDrag = true,
    withHandle = true,
    isScrollEnabled = true,
    customRenderer
  } = props

  const { theme, themeType } = useTheme()
  const { bottom } = useSafeAreaInsets()
  // Callers mostly pass inline callbacks; stable ones keep the sheet and its list from
  // re-rendering for them, while the latest one still runs
  const closeBottomSheet = useLatestCallback(_closeBottomSheet)
  const onClosed = useLatestCallback(() => _onClosed?.())
  const onOpened = useLatestCallback(() => _onOpened?.())
  const onOpen = useLatestCallback(() => _onOpen?.())
  const onBackdropPress = useLatestCallback(() => _onBackdropPress?.())
  const isHeaderFloating = IS_SHEET_HEADER_FLOATING
  // A header with only buttons (no title, nothing below the row) is no bar: just the buttons
  // float, while the content still starts below them
  const [isHeaderRowTitleless, setIsHeaderRowTitleless] = useState(false)
  const isHeaderButtonsOnly = isHeaderRowTitleless && !HeaderComponent
  const isHeaderOverContent = isHeaderFloating || isHeaderButtonsOnly
  const isHeaderFrosted = isHeaderFloating && !isHeaderButtonsOnly
  // Below a frosted header, a list's sticky section headers are glass: the pinned one frosts
  // the header's area too, so both read as one glass (iOS sticks them unless told not to)
  const isSectionHeaderGlass =
    isHeaderFrosted &&
    !!sectionListProps &&
    (sectionListProps as SectionListProps<unknown>).stickySectionHeadersEnabled !== false
  const { setRef, isModal, isOpen, setIsOpen, isNested, id } = useBottomSheetInternal({
    ...props,
    closeBottomSheet
  })
  // The header row (title, ‹ back and X) portals into the sheet's fixed header, so it
  // stays in place while the content scrolls
  const headerHostName = `${id}-header`
  // A sheet without `closeBottomSheet` is one the user can't close, so it gets no X
  const bottomSheetContextValue = useBottomSheetContextValue(
    isOpen,
    isNested,
    props.closeBottomSheet ? closeBottomSheet : undefined,
    headerHostName,
    isHeaderFloating,
    setIsHeaderRowTitleless
  )

  const internalScrollableRef = useRef<any>(null)
  const scrollableRef = externalScrollViewRef || internalScrollableRef
  // TrueSheet rejects a dismiss once the sheet has unmounted, and callers often close an
  // already closed sheet, so close() only reaches TrueSheet while the sheet is up.
  const isPresentedRef = useRef(false)
  // Tells a dismissal started by close() apart from one started by a swipe or a tap outside
  const isClosingProgrammaticallyRef = useRef(false)
  // TrueSheet presents as soon as its content mounts, before the header over it is measured, and
  // fits the content only after the open animation, so a sheet opened in two steps. Instead, the
  // content mounts unpresented (not lazy) and the sheet presents once the header is measured
  const [isMountRequested, setIsMountRequested] = useState(false)
  // A fresh TrueSheet after each close unmounts the content again, as one that isn't lazy keeps it
  const [sheetKey, setSheetKey] = useState(0)
  const [presentRequestId, setPresentRequestId] = useState(0)
  const sheetInstanceRef = useRef<TrueSheet | null>(null)
  const headerContentRef = useRef<View>(null)
  // Until then, nothing is on screen to dismiss
  const hasCalledPresentRef = useRef(false)
  // Set once the caller unmounts the sheet, whose dismissal then reports to no one
  const isUnmountedRef = useRef(false)
  // Callers often clear what the sheet shows as they close it. Emptied mid-dismissal, an auto
  // height sheet resizes while it slides away, so it keeps what it showed until it's gone
  const [isDismissing, setIsDismissing] = useState(false)

  const trueSheetRef = useCallback(
    (sheet: TrueSheet | null) => {
      sheetInstanceRef.current = sheet
      const adapter: SheetRefAdapter | null = sheet && {
        open: () => {
          isPresentedRef.current = true
          setIsMountRequested(true)
        },
        close: () => {
          if (!isPresentedRef.current) return
          isPresentedRef.current = false
          if (!hasCalledPresentRef.current) {
            setIsMountRequested(false)
            setSheetKey((key) => key + 1)
            return
          }
          isClosingProgrammaticallyRef.current = true
          // In the same batch as the caller's own updates, so they render frozen already
          setIsDismissing(true)
          sheet.dismiss().catch(reportSheetError)
        }
      }
      // setRef is shared with web, where it receives the Modalize ref
      setRef(adapter as unknown as HTMLElement | null)
    },
    [setRef]
  )

  // Modalize opened at content height unless told otherwise; TrueSheet needs a detent for it
  const detents = useMemo<SheetDetent[]>(() => {
    if (customRenderer) return FULL_HEIGHT_DETENTS
    if (typeof modalHeight === 'number') {
      return [Math.min(1, modalHeight / DEVICE_HEIGHT)]
    }
    return adjustToContentHeight ? AUTO_DETENTS : FULL_HEIGHT_DETENTS
  }, [adjustToContentHeight, customRenderer, modalHeight])
  const isFixedHeight = detents !== AUTO_DETENTS

  const horizontalPadding = isModal ? SPACING_LG : SPACING_SM
  const hasGrabber = withHandle && !isModal
  const topPadding = hasGrabber ? BELOW_GRABBER_PADDING : SPACING_SM

  // The bottom spacing works like it did with Modalize, so TrueSheet's safe-area insets are
  // off (`insetAdjustment` "never") and the footer, or the content without one, pads by it.
  // A `customRenderer` controls its own layout, so it gets no content padding.
  const bottomInset = bottom || SPACING_SM
  const contentBottomPadding = isModal || FooterComponent ? 0 : bottomInset
  const footerBottomPadding = isModal ? 0 : bottomInset

  // The keyboard is handled natively: the sheet keeps its size and slides up with it, and the
  // list is inset by it. TrueSheet only lifts an absolute footer above the keyboard, so the
  // footer is absolute, but in the sheet's color and with the list ending above it, it looks
  // like the Modalize footer below the content
  const scrollableOptions = useMemo(() => ({ contentInsetAdjustment: 'footer' as const }), [])
  // A floating header covers the top of the content, which starts below it instead
  // The height of what the header holds: its row and the caller's `HeaderComponent`
  const [headerContentHeight, setHeaderContentHeight] = useState(0)
  const handleHeaderLayout = useCallback(
    (e: LayoutChangeEvent) => setHeaderContentHeight(e.nativeEvent.layout.height),
    []
  )
  // A floating header with something in it keeps a gap below what it holds, above its edge
  // (the row keeps its own margin when the header isn't floating, which the height includes)
  const headerEdgeGap = isHeaderFloating && headerContentHeight > 0 ? SPACING_SM : 0
  const contentTopPaddingStyle = useMemo(
    () => ({
      paddingTop: isHeaderOverContent ? topPadding + headerContentHeight + headerEdgeGap : 0
    }),
    [isHeaderOverContent, topPadding, headerContentHeight, headerEdgeGap]
  )
  // A list scrolled as the sheet opens (to its selected row) moves its sticky headers only once
  // scrolled again, as the native scroll value they follow is hooked up after that scroll. Until
  // the user drags it, the list's JS scroll events, which still arrive, set the value too
  const stickyScrollValueRef = useRef<Animated.Value | null>(null)
  const hasUserScrolledListRef = useRef(false)
  // Sticky section headers pin right below a header over the content, not under it
  const stickyHeaderLayout = useMemo<SheetStickyHeaderLayout>(
    () => ({
      offset: contentTopPaddingStyle.paddingTop,
      sidePadding: isSectionHeaderGlass ? horizontalPadding : 0,
      scrollValueRef: stickyScrollValueRef
    }),
    [contentTopPaddingStyle.paddingTop, isSectionHeaderGlass, horizontalPadding]
  )
  // Above the keyboard the footer keeps only a small gap, as the keyboard covers the safe area
  const footerOptions = useMemo(
    () => ({
      position: 'absolute' as const,
      keyboardOffset: -Math.max(0, footerBottomPadding - SPACING_SM)
    }),
    [footerBottomPadding]
  )

  // Fabric measures synchronously, so the padding below the header lands in the same commit
  const handleMount = useCallback(() => {
    if (!isPresentedRef.current) return
    headerContentRef.current?.measure((_x, _y, _width, height) => {
      setHeaderContentHeight(height)
      setPresentRequestId((requestId) => requestId + 1)
    })
  }, [])

  const presentSheet = useCallback(() => {
    const sheet = sheetInstanceRef.current
    if (!isPresentedRef.current || !sheet) return
    hasCalledPresentRef.current = true
    sheet.present().catch(reportSheetError)
  }, [])

  const handleWillPresent = useCallback(() => {
    KeyboardController.dismiss().catch(reportSheetError)
    setIsOpen(true)
    onOpen()
  }, [onOpen, setIsOpen])

  const handleWillDismiss = useCallback(() => {
    const isUserDismissal = !isClosingProgrammaticallyRef.current
    isPresentedRef.current = false
    isClosingProgrammaticallyRef.current = false
    // Reset on close, as the list scrolls to its selected row before the sheet is presented
    hasUserScrolledListRef.current = false
    // Lazy again by the time it's dismissed, so TrueSheet unmounts the content
    setIsMountRequested(false)
    setIsDismissing(true)
    setIsOpen(false)
    // TrueSheet doesn't say whether a swipe or a tap outside closed it, so both run
    // what the Modalize backdrop tap ran
    if (!isUserDismissal) return
    closeBottomSheet()
    onBackdropPress()
  }, [closeBottomSheet, onBackdropPress, setIsOpen])

  const handleDidDismiss = useCallback(() => {
    hasCalledPresentRef.current = false
    setIsDismissing(false)
    if (isUnmountedRef.current) return
    setSheetKey((key) => key + 1)
    onClosed()
  }, [onClosed])

  // A sheet unmounted while presented would stay on screen, frozen: iOS swaps its content for a
  // snapshot and dismisses it only when the view is deallocated, which view recycling skips.
  // So it stays at the app root until dismissed, without telling the gone caller it closed
  const handlePortalUnmount = useCallback((unmount: () => void) => {
    isUnmountedRef.current = true
    const sheet = sheetInstanceRef.current
    if (!sheet || !isPresentedRef.current || !hasCalledPresentRef.current) {
      unmount()
      return
    }
    isPresentedRef.current = false
    isClosingProgrammaticallyRef.current = true
    sheet.dismiss().catch(reportSheetError).finally(unmount)
  }, [])

  const handleBackPress = useCallback(() => {
    closeBottomSheet()
    return true
  }, [closeBottomSheet])

  // Memoized so a list in the sheet (a PureComponent) skips the sheet's re-renders
  const sharedScrollProps = useMemo(
    () => ({
      bounces: false,
      keyboardShouldPersistTaps: 'handled' as const,
      showsVerticalScrollIndicator: false,
      contentContainerStyle: { paddingBottom: contentBottomPadding },
      style: { marginBottom: isModal ? SPACING_LG : 0 }
    }),
    [contentBottomPadding, isModal]
  )

  // Memoized with the sheet's other props, so TrueSheet (a PureComponent) skips re-renders
  // that change none of them
  const sheetContent = useMemo(() => {
    const testID = isOpen ? 'bottom-sheet' : undefined

    if (customRenderer) {
      return (
        <View
          testID={testID}
          style={[common.fullWidth, containerInnerWrapperStyles, contentTopPaddingStyle]}
        >
          {customRenderer}
        </View>
      )
    }
    // iOS leaves rows a list adds while it's in the sheet's window undrawn until it scrolls
    // (a new section, rows shown again) when it clips its offscreen rows, so lists here
    // don't clip there; their virtualization still bounds what they render
    if (flatListProps) {
      const listProps = flatListProps as FlatListProps<unknown>
      // Typed by Modalize as Animated props, which the plain lists accept
      return (
        <FlatList
          ref={scrollableRef}
          {...sharedScrollProps}
          {...listProps}
          removeClippedSubviews={isiOS ? false : listProps.removeClippedSubviews}
          contentContainerStyle={[
            listProps.contentContainerStyle ?? sharedScrollProps.contentContainerStyle,
            contentTopPaddingStyle
          ]}
        />
      )
    }
    if (sectionListProps) {
      const listProps = sectionListProps as SectionListProps<unknown>
      const handleListScroll: SectionListProps<unknown>['onScroll'] = (e) => {
        if (!hasUserScrolledListRef.current) {
          stickyScrollValueRef.current?.setValue(e.nativeEvent.contentOffset.y)
        }
        listProps.onScroll?.(e)
      }
      const handleListScrollBeginDrag: SectionListProps<unknown>['onScrollBeginDrag'] = (e) => {
        hasUserScrolledListRef.current = true
        listProps.onScrollBeginDrag?.(e)
      }
      // The glass of a pinned section header spans the sheet's full width, so the list does
      // too and pads its content instead
      return (
        <SheetStickyHeaderLayoutContext.Provider value={stickyHeaderLayout}>
          <SheetSectionHeaderGlassContext.Provider value={isSectionHeaderGlass}>
            <SectionList
              ref={scrollableRef}
              {...sharedScrollProps}
              StickyHeaderComponent={SheetStickyHeader}
              {...listProps}
              onScroll={handleListScroll}
              onScrollBeginDrag={handleListScrollBeginDrag}
              removeClippedSubviews={isiOS ? false : listProps.removeClippedSubviews}
              style={[
                listProps.style ?? sharedScrollProps.style,
                isSectionHeaderGlass && { marginHorizontal: -horizontalPadding }
              ]}
              contentContainerStyle={[
                listProps.contentContainerStyle ?? sharedScrollProps.contentContainerStyle,
                isSectionHeaderGlass && { paddingHorizontal: horizontalPadding },
                contentTopPaddingStyle
              ]}
            />
          </SheetSectionHeaderGlassContext.Provider>
        </SheetStickyHeaderLayoutContext.Provider>
      )
    }

    return (
      <ScrollView
        ref={scrollableRef}
        {...sharedScrollProps}
        {...(!isScrollEnabled && {
          scrollEnabled: false,
          contentContainerStyle: { flexGrow: 1, paddingBottom: contentBottomPadding }
        })}
        {...((scrollViewProps || {}) as ScrollViewProps)}
      >
        {/* In the inner view, so the caller's `contentContainerStyle` can't drop it */}
        <View style={contentTopPaddingStyle} />
        <View testID={testID} style={[common.fullWidth, containerInnerWrapperStyles]}>
          {children}
        </View>
      </ScrollView>
    )
  }, [
    isOpen,
    customRenderer,
    containerInnerWrapperStyles,
    flatListProps,
    sectionListProps,
    scrollableRef,
    sharedScrollProps,
    isScrollEnabled,
    contentBottomPadding,
    scrollViewProps,
    contentTopPaddingStyle,
    stickyHeaderLayout,
    isSectionHeaderGlass,
    horizontalPadding,
    children
  ])
  // Always there, so the spacing below the grabber is the header's whether a sheet has a
  // header row or not
  // A floating header frosts what scrolls under it across the sheet's full width, with a
  // sharp edge and no divider (UIKit's own scroll edge effect stops at the scroll view's
  // sides and draws a line under its hard style)
  const header = useMemo(
    () => (
      <View
        pointerEvents={isHeaderButtonsOnly ? 'box-none' : 'auto'}
        style={{
          paddingTop: topPadding,
          paddingBottom: headerEdgeGap,
          paddingHorizontal: isHeaderOverContent ? horizontalPadding : 0
        }}
      >
        {/* Over glass section headers the pinned one frosts this area instead */}
        {isHeaderFrosted && !isSectionHeaderGlass && <SheetHeaderBlur />}
        <View ref={headerContentRef} pointerEvents="box-none" onLayout={handleHeaderLayout}>
          <PortalHost name={headerHostName} />
          {/* Below the row, whose own margin the floating header drops (pickers' search) */}
          {!!HeaderComponent && (
            <View style={isHeaderFloating && HEADER_COMPONENT_GAP_STYLE}>{HeaderComponent}</View>
          )}
        </View>
      </View>
    ),
    [
      isHeaderButtonsOnly,
      isHeaderFrosted,
      isSectionHeaderGlass,
      isHeaderOverContent,
      isHeaderFloating,
      topPadding,
      headerEdgeGap,
      horizontalPadding,
      handleHeaderLayout,
      headerHostName,
      HeaderComponent
    ]
  )
  const footer = useMemo(
    () => (FooterComponent ? <>{FooterComponent}</> : undefined),
    [FooterComponent]
  )
  const headerStyle = useMemo(
    () => ({
      // A floating header pads itself, so its blur spans the sheet's full width
      paddingHorizontal: isHeaderOverContent ? 0 : horizontalPadding,
      backgroundColor: isHeaderOverContent ? undefined : theme[backgroundColor],
      // Touches between the floating buttons reach the content below
      pointerEvents: isHeaderButtonsOnly ? ('box-none' as const) : undefined
    }),
    [isHeaderOverContent, isHeaderButtonsOnly, horizontalPadding, theme, backgroundColor]
  )
  const footerStyle = useMemo(
    () => ({
      paddingHorizontal: horizontalPadding,
      paddingBottom: footerBottomPadding,
      backgroundColor: theme[backgroundColor]
    }),
    [horizontalPadding, footerBottomPadding, theme, backgroundColor]
  )
  const sheetStyle = useMemo(
    () => [
      { paddingHorizontal: horizontalPadding },
      isFixedHeight ? FLEX_STYLE : FLEX_SHRINK_STYLE,
      style
    ],
    [horizontalPadding, isFixedHeight, style]
  )
  const sheetChildren = useMemo(
    () => (
      // Gesture handler touchables don't respond inside the sheet on Android without it
      <GestureHandlerRootView style={isFixedHeight ? FLEX_STYLE : FIT_CONTENT_ROOT_STYLE}>
        {sheetContent}
      </GestureHandlerRootView>
    ),
    [isFixedHeight, sheetContent]
  )

  const visibleHeader = useFrozenWhile(header, isDismissing)
  const visibleFooter = useFrozenWhile(footer, isDismissing)
  const visibleSheetChildren = useFrozenWhile(sheetChildren, isDismissing)

  return (
    // At the app root, as with Modalize: in place, the ScrollView of the screen that declares
    // the sheet would be its ancestor, take the first tap to close the keyboard (the X then
    // needs two taps) and make lists in the sheet warn about being nested in it
    <Portal hostName="global" handleOnUnmount={handlePortalUnmount}>
      {/* PortalHost renders portals in a keyless array - without this key React matches */}
      {/* them by position and rebuilds this sheet closed when another one unmounts */}
      <BottomSheetContext.Provider key={id} value={bottomSheetContextValue}>
        <TrueSheet
          key={sheetKey}
          ref={trueSheetRef}
          lazy={!isMountRequested}
          detents={detents}
          scrollableRef={scrollableRef}
          scrollableOptions={scrollableOptions}
          // The system sheet shape (floating on iOS, Material on Android) in our solid surface color,
          // with the corner radius the sheets had before
          backgroundColor={theme[backgroundColor]}
          cornerRadius={BORDER_RADIUS_PRIMARY}
          grabber={hasGrabber}
          // The design's iOS backdrop (a plain dark tint, no blur outside the sheet), a bit darker
          dimColor={isiOS ? IOS_DIM_COLOR : undefined}
          dimOpacity={isiOS ? IOS_DIM_OPACITY[themeType] : undefined}
          dismissible={shouldBeClosableOnDrag}
          header={visibleHeader}
          headerStyle={headerStyle}
          headerOptions={isHeaderOverContent ? ABSOLUTE_HEADER_OPTIONS : undefined}
          footer={visibleFooter}
          footerStyle={footerStyle}
          footerOptions={footerOptions}
          insetAdjustment="never"
          style={sheetStyle}
          onMount={handleMount}
          onWillPresent={handleWillPresent}
          onDidPresent={onOpened}
          onWillDismiss={handleWillDismiss}
          onDidDismiss={handleDidDismiss}
          onBackPress={handleBackPress}
        >
          {visibleSheetChildren}
        </TrueSheet>
        <SheetPresentTrigger requestId={presentRequestId} onRequest={presentSheet} />
      </BottomSheetContext.Provider>
    </Portal>
  )
}

export default React.memo(BottomSheet)
