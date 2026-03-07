import React, { RefObject } from 'react'
import { ScrollView, View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_MD, SPACING_SM } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import { getUiType } from '@common/utils/uiType'
import { Portal } from '@gorhom/portal'
import useIsScrollable from '@web/hooks/useIsScrollable'

import Backdrop from './Backdrop'
import { BottomSheetProps } from './BottomSheet'
import getStyles from './styles'
import useBottomSheetInternal from './useBottomSheetInternal'

const ANIMATION_DURATION: number = 250

const { isPopup } = getUiType()

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
    flatListProps,
    scrollViewProps,
    backgroundColor = 'primaryBackground',
    autoWidth = false,
    shouldBeClosableOnDrag = true,
    withBackdropBlur,
    customRenderer,
    customZIndex,
    isScrollEnabled = true
  } = props

  const { styles, theme } = useTheme(getStyles)

  const {
    isScrollable,
    checkIsScrollable,
    scrollViewRef: internalScrollViewRef
  } = useIsScrollable()
  const scrollViewRef = externalScrollViewRef || internalScrollViewRef

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
  return (
    <Portal hostName="global">
      {/* Wrapping the content in a View with a stable `key` prevents Portal */}
      {/* from losing track of its subtree during React reconciliation and re-renders. */}
      {/* Without this, the backdrop stays, but Modalize could disappear */}
      {/* without even triggering `onClose` or (this) component unmount */}
      <View
        key={`portal-host-${id}`}
        style={[styles.portalHost, customZIndex ? { zIndex: customZIndex } : {}]}
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
              paddingHorizontal: isWeb ? (isModal ? SPACING_MD : SPACING_SM) : SPACING,
              backgroundColor: theme[backgroundColor]
            },
            style
          ]}
          rootStyle={[isPopup && isModal ? spacings.phSm : {}]}
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
          avoidKeyboardLikeIOS
          modalTopOffset={modalTopOffset}
          threshold={90}
          adjustToContentHeight={customRenderer ? false : adjustToContentHeight}
          disableScrollIfPossible={false}
          withOverlay={false}
          onBackButtonPress={() => true}
          panGestureEnabled={shouldBeClosableOnDrag}
          {...(!flatListProps
            ? {
                scrollViewProps: {
                  bounces: false,
                  keyboardShouldPersistTaps: 'handled',
                  ...(!isScrollEnabled && {
                    scrollEnabled: false,
                    nestedScrollEnabled: true,
                    contentContainerStyle: { flex: 1 }
                  }),
                  ...(scrollViewProps || {})
                }
              }
            : {})}
          {...(flatListProps
            ? {
                flatListProps: {
                  bounces: false,
                  keyboardShouldPersistTaps: 'handled',
                  ...(flatListProps || {})
                }
              }
            : {})}
          openAnimationConfig={{
            timing: { duration: ANIMATION_DURATION, delay: 0 }
          }}
          closeAnimationConfig={{
            timing: { duration: ANIMATION_DURATION, delay: 0 }
          }}
          onLayout={checkIsScrollable}
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
                style={[
                  isScrollEnabled && isScrollable ? spacings.prTy : {},
                  common.fullWidth,
                  { flex: 1 },
                  containerInnerWrapperStyles
                ]}
              >
                {customRenderer}
              </View>
            ) : undefined
          }
        >
          {!flatListProps && !customRenderer && (
            <View
              testID={isOpen ? 'bottom-sheet' : undefined}
              style={[
                isScrollEnabled && isScrollable ? spacings.prTy : {},
                common.fullWidth,
                containerInnerWrapperStyles
              ]}
            >
              {children}
            </View>
          )}
        </Modalize>
      </View>
    </Portal>
  )
}

export default React.memo(BottomSheet)
