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
import useTheme from '@common/hooks/useTheme'
import { DEVICE_HEIGHT, SPACING_LG, SPACING_SM } from '@common/styles/spacings'
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

const noop = () => {}

const reportSheetError = (error: unknown) => {
  console.error('BottomSheet: opening or closing the sheet failed', error)
  captureException(error)
}

const BottomSheet: React.FC<BottomSheetProps> = (props: BottomSheetProps) => {
  const {
    scrollViewRef: externalScrollViewRef,
    children,
    closeBottomSheet = noop,
    adjustToContentHeight = true,
    modalHeight,
    style = {},
    containerInnerWrapperStyles = {},
    onClosed,
    onOpened,
    onOpen,
    onBackdropPress,
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
  const { setRef, isModal, isOpen, setIsOpen } = useBottomSheetInternal(props)
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
    !!onOpen && onOpen()
  }, [onOpen, setIsOpen])

  const handleDidPresent = useCallback(() => {
    !!onOpened && onOpened()
  }, [onOpened])

  const handleWillDismiss = useCallback(() => {
    const isUserDismissal = !isClosingProgrammaticallyRef.current
    isPresentedRef.current = false
    isClosingProgrammaticallyRef.current = false
    setIsOpen(false)
    // TrueSheet doesn't say whether a swipe or a tap outside closed it, so both run
    // what the Modalize backdrop tap ran
    if (!isUserDismissal) return
    closeBottomSheet()
    !!onBackdropPress && onBackdropPress()
  }, [closeBottomSheet, onBackdropPress, setIsOpen])

  const handleDidDismiss = useCallback(() => {
    !!onClosed && onClosed()
  }, [onClosed])

  const handleBackPress = useCallback(() => {
    closeBottomSheet()
    return true
  }, [closeBottomSheet])

  const sharedScrollProps = {
    bounces: false,
    keyboardShouldPersistTaps: 'handled' as const,
    showsVerticalScrollIndicator: false,
    contentContainerStyle: { paddingBottom: contentBottomPadding },
    style: { marginBottom: isModal ? SPACING_LG : 0 }
  }

  const renderContent = () => {
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
  }

  return (
    <BottomSheetContext.Provider value={bottomSheetContextValue}>
      <TrueSheet
        ref={trueSheetRef}
        detents={detents}
        scrollableRef={scrollableRef}
        scrollableOptions={scrollableOptions}
        // The system sheet shape (floating on iOS, Material on Android) in our solid surface color,
        // with the corner radius the sheets had before
        backgroundColor={theme[backgroundColor]}
        cornerRadius={BORDER_RADIUS_PRIMARY}
        grabber={withHandle && !isModal}
        // The design's iOS backdrop (a plain dark tint, no blur outside the sheet), a bit darker
        dimColor={isiOS ? IOS_DIM_COLOR : undefined}
        dimOpacity={isiOS ? IOS_DIM_OPACITY[themeType] : undefined}
        dismissible={shouldBeClosableOnDrag}
        header={HeaderComponent ? <>{HeaderComponent}</> : undefined}
        headerStyle={{ paddingTop: SPACING_SM, paddingHorizontal: horizontalPadding }}
        footer={FooterComponent ? <>{FooterComponent}</> : undefined}
        footerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: footerBottomPadding,
          backgroundColor: theme[backgroundColor]
        }}
        footerOptions={footerOptions}
        insetAdjustment="never"
        style={[
          {
            paddingTop: HeaderComponent ? 0 : SPACING_SM,
            paddingHorizontal: horizontalPadding
          },
          isFixedHeight && { flex: 1 },
          style
        ]}
        onWillPresent={handleWillPresent}
        onDidPresent={handleDidPresent}
        onWillDismiss={handleWillDismiss}
        onDidDismiss={handleDidDismiss}
        onBackPress={handleBackPress}
      >
        {/* Gesture handler touchables don't respond inside the sheet on Android without it */}
        <GestureHandlerRootView style={isFixedHeight ? { flex: 1 } : { flexGrow: 1 }}>
          {renderContent()}
        </GestureHandlerRootView>
      </TrueSheet>
    </BottomSheetContext.Provider>
  )
}

export default React.memo(BottomSheet)
