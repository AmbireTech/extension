import React, { RefObject } from 'react'
import { ScrollView, useWindowDimensions, View } from 'react-native'
import {
  useReanimatedFocusedInput,
  useReanimatedKeyboardAnimation
} from 'react-native-keyboard-controller'
import { Modalize } from 'react-native-modalize'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import { Portal } from '@gorhom/portal'

import Backdrop from './Backdrop'
import { BottomSheetProps } from './BottomSheet'
import getStyles from './styles'
import useBottomSheetInternal from './useBottomSheetInternal'

const ANIMATION_DURATION: number = 250

const BottomSheet: React.FC<BottomSheetProps> = (props: BottomSheetProps) => {
  const {
    id: _id,
    type: _type,
    scrollViewRef: externalScrollViewRef,
    children,
    closeBottomSheet = () => {},
    adjustToContentHeight = true,
    style = {},
    containerInnerWrapperStyles = {},
    onClosed,
    onOpen,
    onBackdropPress,
    HeaderComponent,
    flatListProps,
    sectionListProps,
    scrollViewProps,
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
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation()
  const { input } = useReanimatedFocusedInput()
  const { height: windowHeight } = useWindowDimensions()
  const currentTranslateY = useSharedValue(0)

  const {
    modalTopOffset,
    setRef,
    isModal,
    isOpen,
    setIsOpen,
    isBackdropVisible,
    setIsBackdropVisible,
    id
  } = useBottomSheetInternal(props)

  const keyboardOffsetStyle = useAnimatedStyle(() => {
    const kbHeight = Math.abs(keyboardHeight.value)
    if (kbHeight === 0) {
      currentTranslateY.value = 0
      return { transform: [{ translateY: 0 }] }
    }

    let shift = kbHeight

    if (input.value) {
      const restingY = input.value.layout.absoluteY - currentTranslateY.value
      const inputBottomY = restingY + input.value.layout.height
      const keyboardTopY = windowHeight - kbHeight
      const requiredShift = inputBottomY + 24 - keyboardTopY
      const maxShift = Math.max(0, restingY - modalTopOffset - 24)

      if (requiredShift > 0) {
        shift = Math.min(kbHeight, requiredShift, maxShift)
      } else {
        shift = 0
      }
    }

    currentTranslateY.value = -shift
    return { transform: [{ translateY: -shift + SPACING_SM }] }
  })

  const scrollViewRef = externalScrollViewRef

  return (
    <Portal hostName="global">
      {/* Wrapping the content in a View with a stable `key` prevents Portal */}
      {/* from losing track of its subtree during React reconciliation and re-renders. */}
      {/* Without this, the backdrop stays, but Modalize could disappear */}
      {/* without even triggering `onClose` or (this) component unmount */}
      <Animated.View
        key={`portal-host-${id}`}
        style={[
          styles.portalHost,
          customZIndex ? { zIndex: customZIndex } : {},
          keyboardOffsetStyle
        ]}
        pointerEvents="box-none"
      >
        {!!isBackdropVisible && (
          <Backdrop
            isVisible={isBackdropVisible}
            isBottomSheetVisible={isOpen}
            customZIndex={customZIndex ? customZIndex - 1 : undefined}
            onPress={() => {
              closeBottomSheet()
              !!onBackdropPress && onBackdropPress()
            }}
            withBlur={withBackdropBlur}
          />
        )}
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
            isModal
              ? { ...styles.modal, ...(autoWidth ? { maxWidth: null, width: 'auto' } : {}) }
              : {},

            {
              paddingHorizontal: SPACING_SM,
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
          useNativeDriver={false}
          avoidKeyboardLikeIOS={false}
          modalTopOffset={modalTopOffset}
          threshold={90}
          HeaderComponent={HeaderComponent}
          adjustToContentHeight={customRenderer ? false : adjustToContentHeight}
          disableScrollIfPossible={false}
          withOverlay={false}
          onBackButtonPress={() => true}
          panGestureEnabled={shouldBeClosableOnDrag}
          {...(!flatListProps && !sectionListProps
            ? {
                scrollViewProps: {
                  bounces: false,
                  keyboardShouldPersistTaps: 'handled',
                  ...(!isScrollEnabled && {
                    scrollEnabled: false,
                    nestedScrollEnabled: true,
                    contentContainerStyle: { flexGrow: 1 }
                  }),
                  style: { marginBottom: bottom + SPACING_SM },
                  ...(scrollViewProps || {})
                }
              }
            : {})}
          {...(flatListProps
            ? {
                flatListProps: {
                  bounces: false,
                  keyboardShouldPersistTaps: 'handled',
                  style: { marginBottom: bottom + SPACING_SM },
                  ...(flatListProps || {})
                }
              }
            : {})}
          {...(sectionListProps
            ? {
                sectionListProps: {
                  bounces: false,
                  keyboardShouldPersistTaps: 'handled',
                  style: { marginBottom: bottom + SPACING_SM },
                  ...(sectionListProps || {})
                }
              }
            : {})}
          openAnimationConfig={{
            timing: { duration: ANIMATION_DURATION, delay: 0 }
          }}
          closeAnimationConfig={{
            timing: { duration: ANIMATION_DURATION, delay: 0 }
          }}
          onOpen={() => {
            setIsOpen(true)
            setIsBackdropVisible(true)
            !!onOpen && onOpen()
          }}
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
    </Portal>
  )
}

export default React.memo(BottomSheet)
