import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
  KeyboardEvents
} from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useIsInsideBottomSheet } from '@common/components/BottomSheet/BottomSheetContext'
import { useOpenBottomSheetsCount } from '@common/components/BottomSheet/bottomSheetEventStream'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_LG, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import {
  MobileLayoutContainerProps,
  MobileLayoutWrapperMainContentProps
} from './MobileLayoutWrapper'
import getStyles from './styles'

const KeyboardAwareContainerContext = createContext(false)

// Starts the overlay right under the header, which has a SPACING_LG bottom margin
const HEADER_OVERLAY_STYLE: ViewStyle = {
  position: 'absolute',
  top: -SPACING_LG,
  left: 0,
  right: 0,
  bottom: 0
}

/**
 * Renders `headerOverlay` on top of the content, starting right under the header.
 * The overlay covers the whole content area (and not only its own height), because
 * Android doesn't deliver touches to children that overflow their parent. Touches
 * that miss the overlay's children pass through to the content below.
 */
const WithHeaderOverlay = ({
  headerOverlay,
  children
}: {
  headerOverlay?: ReactNode
  children: ReactNode
}) => {
  if (!headerOverlay) return <>{children}</>

  return (
    <View style={flexbox.flex1}>
      {children}
      <View style={HEADER_OVERLAY_STYLE} pointerEvents="box-none">
        {headerOverlay}
      </View>
    </View>
  )
}

const MobileLayoutContainer: React.FC<MobileLayoutContainerProps> = ({
  backgroundColor,
  header,
  footer,
  footerStyle,
  children,
  renderDirectChildren,
  style,
  withHorizontalPadding = false,
  withTopPadding = true,
  keyboardAwareFooter = true
}) => {
  const { theme } = useTheme(getStyles)
  const insets = useSafeAreaInsets()
  const isInsideBottomSheet = useIsInsideBottomSheet()
  const openBottomSheetsCount = useOpenBottomSheetsCount()
  const isSheetOpen = openBottomSheetsCount > 0

  const [keepSuppressedUntilKeyboardHidden, setKeepSuppressedUntilKeyboardHidden] = useState(false)
  const [isKeyboardUp, setIsKeyboardUp] = useState(false)
  const isSheetOpenRef = useRef(isSheetOpen)
  isSheetOpenRef.current = isSheetOpen

  useEffect(() => {
    const willShowSub = KeyboardEvents.addListener('keyboardWillShow', () => {
      setIsKeyboardUp(true)
      // If the keyboard comes up while a sheet is open, remember that we must
      // keep avoidance suppressed through the keyboard's hide animation later.
      if (isSheetOpenRef.current) setKeepSuppressedUntilKeyboardHidden(true)
    })
    const didHideSub = KeyboardEvents.addListener('keyboardDidHide', () => {
      setIsKeyboardUp(false)
      setKeepSuppressedUntilKeyboardHidden(false)
    })

    return () => {
      willShowSub.remove()
      didHideSub.remove()
    }
  }, [])

  const paddingTop = isInsideBottomSheet ? 0 : insets.top + (withTopPadding ? SPACING_SM : 0)

  // A sheet opening turns the avoidance off mid keyboard-hide animation, leaving the content
  // sized for a keyboard that has gone. It stays on until the keyboard is actually down.
  const isKeyboardAvoidingEnabled =
    keyboardAwareFooter && (!isSheetOpen || isKeyboardUp) && !keepSuppressedUntilKeyboardHidden

  return (
    // `behavior="padding"` pads the container's bottom by the keyboard's overlap,
    // so the flex:1 content area compresses and the footer is pushed up above the
    // keyboard instead of being covered by it. The overlap is measured from the
    // view's on-screen frame, so the bottom safe-area inset is accounted for.
    // Not "height": once closed it returns no style, and Reanimated keeps the last height
    // it set, so at times the footer stayed lifted after the keyboard hid
    <KeyboardAvoidingView
      behavior="padding"
      enabled={isKeyboardAvoidingEnabled}
      style={[
        flexbox.flex1,
        {
          backgroundColor: backgroundColor || theme.primaryBackground,
          paddingTop
        }
      ]}
    >
      {!!header && <View style={[spacings.phSm, spacings.mbSm]}>{header}</View>}
      <View style={[flexbox.flex1, withHorizontalPadding ? spacings.phSm : undefined]}>
        <View
          style={[
            flexbox.flex1,
            {
              backgroundColor: backgroundColor || theme.primaryBackground,
              width: '100%'
            },
            style
          ]}
        >
          <KeyboardAwareContainerContext.Provider value={keyboardAwareFooter}>
            {children}
          </KeyboardAwareContainerContext.Provider>
        </View>
      </View>
      {!!footer && (
        <View
          style={[
            { paddingBottom: insets.bottom || SPACING_SM },
            spacings.ptSm,
            spacings.phSm,
            footerStyle
          ]}
        >
          {footer}
        </View>
      )}
      {!!renderDirectChildren && renderDirectChildren()}
    </KeyboardAvoidingView>
  )
}

const MobileLayoutWrapperMainContent: React.FC<MobileLayoutWrapperMainContentProps> = ({
  children,
  wrapperRef,
  contentContainerStyle = {},
  withScroll = false,
  keyboardAwareScrollViewProps = {},
  withBackButton = false,
  withHorizontalPadding = true,
  onBackButtonPress,
  rightIcon,
  title,
  headerOverlay,
  ...rest
}) => {
  const { goBack } = useNavigation()
  const insets = useSafeAreaInsets()
  const isInsideKeyboardAwareContainer = useContext(KeyboardAwareContainerContext)

  const hasHeader = !!title || !!withBackButton

  const handleBackButtonPress = () => {
    if (onBackButtonPress) {
      onBackButtonPress()
    } else {
      goBack()
    }
  }

  if (withScroll) {
    return (
      <View style={[flexbox.flex1, withHorizontalPadding && spacings.phSm]}>
        {hasHeader && (
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
            {!!withBackButton && <PanelBackButton onPress={handleBackButtonPress} />}
            {!!title && <PanelTitle title={title} size={18} />}
            {!!withBackButton && (
              <View style={[{ width: 28 }, flexbox.alignCenter]}>{rightIcon}</View>
            )}
          </View>
        )}
        <WithHeaderOverlay headerOverlay={hasHeader ? headerOverlay : undefined}>
          <KeyboardAwareScrollView
            ref={wrapperRef}
            style={flexbox.flex1}
            contentContainerStyle={[
              { flexGrow: 1, paddingBottom: insets.bottom || SPACING_SM },
              contentContainerStyle
            ]}
            bottomOffset={200}
            extraKeyboardSpace={isInsideKeyboardAwareContainer ? -1000 : 0}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
            {...keyboardAwareScrollViewProps}
            {...rest}
          >
            {children}
          </KeyboardAwareScrollView>
        </WithHeaderOverlay>
      </View>
    )
  }

  return (
    <View
      ref={wrapperRef}
      style={[flexbox.flex1, withHorizontalPadding && spacings.phSm, contentContainerStyle]}
    >
      {hasHeader && (
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
          {!!withBackButton && <PanelBackButton onPress={handleBackButtonPress} />}
          {!!title && <PanelTitle title={title} size={18} />}
          {!!withBackButton && (
            <View style={[{ width: 28, maxHeight: 15 }, flexbox.center]}>{rightIcon}</View>
          )}
        </View>
      )}
      <WithHeaderOverlay headerOverlay={hasHeader ? headerOverlay : undefined}>
        {children}
      </WithHeaderOverlay>
    </View>
  )
}

export { MobileLayoutContainer, MobileLayoutWrapperMainContent }
