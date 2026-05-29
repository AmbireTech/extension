import React, { RefObject, useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import {
  KeyboardController,
  KeyboardEvents,
  useReanimatedKeyboardAnimation
} from 'react-native-keyboard-controller'
import { Modalize } from 'react-native-modalize'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_LG, SPACING_SM } from '@common/styles/spacings'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { Portal } from '@gorhom/portal'

import Backdrop from './Backdrop'
import { BottomSheetProps } from './BottomSheet'
import { BottomSheetContext } from './BottomSheetContext'
import getStyles from './styles'
import useBottomSheetInternal from './useBottomSheetInternal'

const DEFAULT_ANIMATION_DURATION: number = 250

const BottomSheet: React.FC<BottomSheetProps> = (props: BottomSheetProps) => {
  const {
    id: _id,
    type: _type,
    scrollViewRef: externalScrollViewRef,
    children,
    closeBottomSheet: _closeBottomSheet = () => {},
    adjustToContentHeight = true,
    modalHeight,
    style = {},
    containerInnerWrapperStyles = {},
    onClosed,
    onOpened,
    onOpen,
    onBackdropPress,
    HeaderComponent,
    flatListProps,
    sectionListProps,
    scrollViewProps,
    animationDuration = DEFAULT_ANIMATION_DURATION,
    backgroundColor = 'primaryBackground',
    autoWidth = false,
    shouldBeClosableOnDrag = true,
    withBackdropBlur,
    customZIndex,
    isScrollEnabled = true,
    customRenderer
  } = props

  const { styles, theme } = useTheme(getStyles)
  const { bottom } = useSafeAreaInsets()
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [visibleKeyboardHeight, setVisibleKeyboardHeight] = useState(0)
  const closeBottomSheet = React.useCallback(_closeBottomSheet, [_closeBottomSheet])

  useEffect(() => {
    const showSub = KeyboardEvents.addListener('keyboardWillShow', (e) => {
      setIsKeyboardVisible(true)
      setVisibleKeyboardHeight(e.height)
    })
    const hideSub = KeyboardEvents.addListener('keyboardWillHide', () => {
      setIsKeyboardVisible(false)
      setVisibleKeyboardHeight(0)
    })

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const {
    modalTopOffset,
    setRef,
    isModal,
    isOpen,
    setIsOpen,
    isBackdropVisible,
    setIsBackdropVisible,
    id,
    computedZIndex
  } = useBottomSheetInternal(props)

  const { height: keyboardHeight } = useReanimatedKeyboardAnimation()

  // Lift modals above the keyboard. `keyboardHeight` is 0 when hidden and goes
  // negative as the keyboard rises, so half of it is enough to clear a
  // vertically centered modal without pushing it off the top of the screen.
  const modalKeyboardOffsetStyle = useAnimatedStyle(() => {
    if (!isModal) return { transform: [{ translateY: 0 }] }
    return { transform: [{ translateY: keyboardHeight.value / 2 }] }
  }, [isModal])

  const scrollViewRef = externalScrollViewRef

  // Pad the scrollable content by the keyboard height so the content hidden
  // behind the keyboard becomes reachable by scrolling while it's open. Only
  // applies to the ScrollView/FlatList/SectionList paths; a `customRenderer`
  // controls its own layout, so it keeps the plain bottom inset.
  const contentBottomPadding =
    (bottom || SPACING_SM) + (!customRenderer && isKeyboardVisible ? visibleKeyboardHeight : 0)

  return (
    <Portal hostName="global">
      <BottomSheetContext.Provider value={true}>
        {/* Wrapping the content in a View with a stable `key` prevents Portal */}
        {/* from losing track of its subtree during React reconciliation and re-renders. */}
        {/* Without this, the backdrop stays, but Modalize could disappear */}
        {/* without even triggering `onClose` or (this) component unmount */}
        {!!isBackdropVisible && (
          <Backdrop
            isVisible={isBackdropVisible}
            isBottomSheetVisible={isOpen}
            customZIndex={computedZIndex ? computedZIndex - 1 : undefined}
            onPress={() => {
              closeBottomSheet()
              !!onBackdropPress && onBackdropPress()
            }}
            withBlur={withBackdropBlur}
          />
        )}
        <Animated.View
          key={`portal-host-${id}`}
          style={[styles.portalHost, { zIndex: computedZIndex }, modalKeyboardOffsetStyle]}
          pointerEvents="box-none"
        >
          <Modalize
            // The key is used to force the re-render of the component when there is an opened
            // bottom sheet and the user navigates to a route that also has a bottom sheet. Without
            // this key or without a unique key, the bottom sheet will not close when navigating
            key={id}
            ref={setRef}
            // React 19 makes refs strictly nullable. Temporary cast until Modalize updates its types.
            contentRef={scrollViewRef as RefObject<ScrollView>}
            modalStyle={[
              styles.bottomSheet,
              {
                borderBottomEndRadius: isKeyboardVisible ? BORDER_RADIUS_PRIMARY : 0,
                borderBottomStartRadius: isKeyboardVisible ? BORDER_RADIUS_PRIMARY : 0,
                paddingHorizontal: SPACING_SM
              },
              isModal
                ? {
                    ...styles.modal,
                    ...(autoWidth ? { maxWidth: null, width: 'auto' } : {}),
                    borderBottomEndRadius: 30,
                    borderTopLeftRadius: 30,
                    borderBottomStartRadius: 30,
                    borderTopRightRadius: 30,
                    paddingHorizontal: SPACING_LG
                  }
                : {},

              {
                backgroundColor: theme[backgroundColor]
              },
              style
            ]}
            rootStyle={[isModal && spacings.phSm]}
            handleStyle={[
              styles.dragger,
              isModal
                ? {
                    display: 'none'
                  }
                : {}
            ]}
            handlePosition="inside"
            useNativeDriver={true}
            avoidKeyboardLikeIOS={false}
            modalTopOffset={modalTopOffset}
            modalHeight={modalHeight}
            threshold={90}
            HeaderComponent={HeaderComponent}
            adjustToContentHeight={
              customRenderer ? false : !isModal && isKeyboardVisible ? false : adjustToContentHeight
            }
            disableScrollIfPossible={false}
            withOverlay={false}
            onBackButtonPress={() => {
              closeBottomSheet()
              return true
            }}
            panGestureEnabled={shouldBeClosableOnDrag}
            {...(!flatListProps && !sectionListProps
              ? {
                  scrollViewProps: {
                    bounces: false,
                    keyboardShouldPersistTaps: 'handled',
                    showsVerticalScrollIndicator: false,
                    contentContainerStyle: { paddingBottom: contentBottomPadding },
                    ...(!isScrollEnabled && {
                      scrollEnabled: false,
                      nestedScrollEnabled: true,
                      contentContainerStyle: { flexGrow: 1, paddingBottom: contentBottomPadding }
                    }),
                    style: { marginBottom: isModal ? SPACING_LG : 0 },
                    ...(scrollViewProps || {})
                  }
                }
              : {})}
            {...(flatListProps
              ? {
                  flatListProps: {
                    bounces: false,
                    keyboardShouldPersistTaps: 'handled',
                    showsVerticalScrollIndicator: false,
                    contentContainerStyle: { paddingBottom: contentBottomPadding },
                    style: { marginBottom: isModal ? SPACING_LG : 0 },
                    ...(flatListProps || {})
                  }
                }
              : {})}
            {...(sectionListProps
              ? {
                  sectionListProps: {
                    bounces: false,
                    keyboardShouldPersistTaps: 'handled',
                    showsVerticalScrollIndicator: false,
                    contentContainerStyle: { paddingBottom: contentBottomPadding },
                    style: { marginBottom: isModal ? SPACING_LG : 0 },
                    ...(sectionListProps || {})
                  }
                }
              : {})}
            openAnimationConfig={{
              timing: { duration: animationDuration, delay: 0 }
            }}
            closeAnimationConfig={{
              timing: { duration: animationDuration, delay: 0 }
            }}
            onOpen={() => {
              KeyboardController.dismiss()
              setIsOpen(true)
              setIsBackdropVisible(true)
              !!onOpen && onOpen()
            }}
            onOpened={() => !!onOpened && onOpened()}
            onClose={() => setIsOpen(false)}
            onClosed={() => !!onClosed && onClosed()}
            customRenderer={
              customRenderer ? (
                <View
                  testID={isOpen ? 'bottom-sheet' : undefined}
                  style={[common.fullWidth, containerInnerWrapperStyles]}
                >
                  {customRenderer}
                </View>
              ) : undefined
            }
          >
            {!flatListProps && !sectionListProps && !customRenderer && (
              <View
                testID={isOpen ? 'bottom-sheet' : undefined}
                style={[common.fullWidth, containerInnerWrapperStyles]}
              >
                {children}
              </View>
            )}
          </Modalize>
        </Animated.View>
      </BottomSheetContext.Provider>
    </Portal>
  )
}

export default React.memo(BottomSheet)
