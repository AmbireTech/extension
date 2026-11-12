import React, { useCallback, useMemo, useRef } from 'react'
import {
  FlatList,
  FlatListProps,
  ScrollView,
  ScrollViewProps,
  SectionList,
  SectionListProps,
  View
} from 'react-native'
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
import { SheetDetent, TrueSheet } from '@lodev09/react-native-true-sheet'

import { BottomSheetProps } from './BottomSheet'
import { BottomSheetContext, useBottomSheetContextValue } from './BottomSheetContext'
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
const FLEX_STYLE = { flex: 1 }
/**
 * Where the content starts below the native grabber, which overlays the top of the sheet:
 * it ends ~10pt down on iOS (5pt margin + 5pt pill) and ~20dp on Android (16dp + 4dp)
 */
const BELOW_GRABBER_PADDING = isiOS ? SPACING_MD : SPACING_XL
// Shared defaults, as a new `{}` per render would defeat the memoization below
const EMPTY_STYLE = {}
const FLEX_GROW_STYLE = { flexGrow: 1 }

const noop = () => {}

/**
 * The context a ScrollView gives its descendants, which a list inside uses to warn about
 * being nested in a ScrollView. Missing from the legacy React Native types this repo uses.
 */
const ScrollViewContext = (ScrollView as unknown as { Context: React.Context<unknown> }).Context

const reportSheetError = (error: unknown) => {
  console.error('BottomSheet: opening or closing the sheet failed', error)
  captureException(error)
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
  const { setRef, isModal, isOpen, setIsOpen } = useBottomSheetInternal({
    ...props,
    closeBottomSheet
  })
  const bottomSheetContextValue = useBottomSheetContextValue(isOpen)

  const internalScrollableRef = useRef<any>(null)
  const scrollableRef = externalScrollViewRef || internalScrollableRef
  // TrueSheet rejects a dismiss once the sheet has unmounted, and callers often close an
  // already closed sheet, so close() only reaches TrueSheet while the sheet is up.
  const isPresentedRef = useRef(false)
  // Tells a dismissal started by close() apart from one started by a swipe or a tap outside
  const isClosingProgrammaticallyRef = useRef(false)

  const trueSheetRef = useCallback(
    (sheet: TrueSheet | null) => {
      const adapter: SheetRefAdapter | null = sheet && {
        open: () => {
          isPresentedRef.current = true
          sheet.present().catch(reportSheetError)
        },
        close: () => {
          if (!isPresentedRef.current) return
          isPresentedRef.current = false
          isClosingProgrammaticallyRef.current = true
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
  // Above the keyboard the footer keeps only a small gap, as the keyboard covers the safe area
  const footerOptions = useMemo(
    () => ({
      position: 'absolute' as const,
      keyboardOffset: -Math.max(0, footerBottomPadding - SPACING_SM)
    }),
    [footerBottomPadding]
  )

  const handleWillPresent = useCallback(() => {
    KeyboardController.dismiss().catch(reportSheetError)
    setIsOpen(true)
    onOpen()
  }, [onOpen, setIsOpen])

  const handleWillDismiss = useCallback(() => {
    const isUserDismissal = !isClosingProgrammaticallyRef.current
    isPresentedRef.current = false
    isClosingProgrammaticallyRef.current = false
    setIsOpen(false)
    // TrueSheet doesn't say whether a swipe or a tap outside closed it, so both run
    // what the Modalize backdrop tap ran
    if (!isUserDismissal) return
    closeBottomSheet()
    onBackdropPress()
  }, [closeBottomSheet, onBackdropPress, setIsOpen])

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
        <View testID={testID} style={[common.fullWidth, containerInnerWrapperStyles]}>
          {customRenderer}
        </View>
      )
    }
    if (flatListProps) {
      // Typed by Modalize as Animated props, which the plain lists accept
      return (
        <FlatList
          ref={scrollableRef}
          {...sharedScrollProps}
          {...(flatListProps as FlatListProps<unknown>)}
        />
      )
    }
    if (sectionListProps) {
      return (
        <SectionList
          ref={scrollableRef}
          {...sharedScrollProps}
          {...(sectionListProps as SectionListProps<unknown>)}
        />
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
    children
  ])
  const header = useMemo(
    () => (HeaderComponent ? <>{HeaderComponent}</> : undefined),
    [HeaderComponent]
  )
  const footer = useMemo(
    () => (FooterComponent ? <>{FooterComponent}</> : undefined),
    [FooterComponent]
  )
  const headerStyle = useMemo(
    () => ({ paddingTop: topPadding, paddingHorizontal: horizontalPadding }),
    [topPadding, horizontalPadding]
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
      { paddingTop: HeaderComponent ? 0 : topPadding, paddingHorizontal: horizontalPadding },
      isFixedHeight && { flex: 1 },
      style
    ],
    [HeaderComponent, topPadding, horizontalPadding, isFixedHeight, style]
  )
  const sheetChildren = useMemo(
    () => (
      // Gesture handler touchables don't respond inside the sheet on Android without it
      <GestureHandlerRootView style={isFixedHeight ? FLEX_STYLE : FLEX_GROW_STYLE}>
        {sheetContent}
      </GestureHandlerRootView>
    ),
    [isFixedHeight, sheetContent]
  )

  return (
    <BottomSheetContext.Provider value={bottomSheetContextValue}>
      {/* The sheet is presented in its own window, so a list in it isn't nested in the */}
      {/* ScrollView of the screen that declares it, as it wasn't when Modalize portaled it out */}
      <ScrollViewContext.Provider value={null}>
        <TrueSheet
          ref={trueSheetRef}
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
          header={header}
          headerStyle={headerStyle}
          footer={footer}
          footerStyle={footerStyle}
          footerOptions={footerOptions}
          insetAdjustment="never"
          style={sheetStyle}
          onWillPresent={handleWillPresent}
          onDidPresent={onOpened}
          onWillDismiss={handleWillDismiss}
          onDidDismiss={onClosed}
          onBackPress={handleBackPress}
        >
          {sheetChildren}
        </TrueSheet>
      </ScrollViewContext.Provider>
    </BottomSheetContext.Provider>
  )
}

export default React.memo(BottomSheet)
