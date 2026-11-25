import React, { useCallback, useEffect, useState } from 'react'
import {
  BackHandler,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import CloseIcon from '@common/assets/svg/CloseIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import AboveSheetsOverlay from '@common/components/AboveSheetsOverlay'
import FadeInView from '@common/components/FadeInView'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { TooltipAnchor, tooltipManager } from '@common/components/Tooltip/TooltipManager'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY, POPOVER_BACKDROP_OPACITY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { Portal } from '@gorhom/portal'

const MAX_WIDTH = 320
const ARROW_SIZE = 12
const CLOSE_BUTTON_SIZE = 12
/**
 * Space between the card and the element that opened it: the pointer (a square turned 45deg,
 * so it sticks out by half its diagonal) plus a small gap.
 */
const ANCHOR_GAP = Math.round(ARROW_SIZE / Math.SQRT2) + 3

type Placement = {
  /** Positions the tooltip below or above the anchor, or centers it without one. */
  containerStyle: ViewStyle
  maxHeight: number
  arrowLeft: number | null
  isBelow: boolean
}

/**
 * Places the tooltip below the anchor, or above it when the anchor is in the bottom half of the
 * screen, centered on it and kept within the screen edges.
 */
const getPlacement = (
  anchor: TooltipAnchor | null,
  frame: { width: number; height: number },
  insets: { top: number; bottom: number }
): Placement => {
  const width = Math.min(MAX_WIDTH, frame.width - SPACING * 2)
  const minTop = insets.top + SPACING
  const maxBottom = frame.height - insets.bottom - SPACING

  if (!anchor) {
    return {
      containerStyle: {
        width,
        left: (frame.width - width) / 2,
        top: minTop,
        bottom: frame.height - maxBottom,
        justifyContent: 'center'
      },
      maxHeight: maxBottom - minTop,
      arrowLeft: null,
      isBelow: true
    }
  }

  const anchorCenterX = anchor.x + anchor.width / 2
  const left = Math.min(Math.max(SPACING, anchorCenterX - width / 2), frame.width - SPACING - width)
  // The pointer stays clear of the rounded corners
  const arrowLeft = Math.min(
    Math.max(BORDER_RADIUS_PRIMARY, anchorCenterX - left - ARROW_SIZE / 2),
    width - BORDER_RADIUS_PRIMARY - ARROW_SIZE
  )
  const isBelow = anchor.y + anchor.height / 2 < frame.height / 2

  if (isBelow) {
    const top = anchor.y + anchor.height + ANCHOR_GAP
    return {
      containerStyle: { width, left, top },
      maxHeight: maxBottom - top,
      arrowLeft,
      isBelow
    }
  }

  const bottom = anchor.y - ANCHOR_GAP
  return {
    containerStyle: { width, left, bottom: frame.height - bottom },
    maxHeight: bottom - minTop,
    arrowLeft,
    isBelow
  }
}

/** A popover next to the tapped ⓘ, drawn above open sheets. A tap anywhere else closes it. */
export function GlobalTooltip() {
  const [activeTooltip, setActiveTooltip] = useState(tooltipManager.getActiveTooltip())
  const [anchor, setAnchor] = useState(tooltipManager.getActiveAnchor())
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  // The overlay's own size, as the anchor is in its coordinates. The safe area frame can be
  // shorter (by the status bar), which moved a tooltip above its anchor too high.
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | null>(null)
  const handleOverlayLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setOverlaySize((prev) =>
      prev?.width === layout.width && prev?.height === layout.height
        ? prev
        : { width: layout.width, height: layout.height }
    )
  }, [])

  // Only update state from the subscription
  useEffect(() => {
    return tooltipManager.subscribe(() => {
      setActiveTooltip(tooltipManager.getActiveTooltip())
      setAnchor(tooltipManager.getActiveAnchor())
    })
  }, [])

  const close = useCallback(() => tooltipManager.hide(), [])

  const isOpen = !!activeTooltip
  useEffect(() => {
    if (!isOpen) return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      close()
      return true
    })
    return () => subscription.remove()
  }, [isOpen, close])

  if (!activeTooltip) return null

  const { title, children } = activeTooltip
  // When the content is the same as the title, show it only once, as the title
  const hasContent = !!children && children !== title
  const surfaceStyle = { backgroundColor: theme.primaryBackground }

  const closeButton = (
    <HoverablePressable
      onPress={close}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={t('Close')}
      style={spacings.mlTy}
    >
      <CloseIcon
        width={CLOSE_BUTTON_SIZE}
        height={CLOSE_BUTTON_SIZE}
        strokeWidth="2"
        color={theme.iconPrimary}
      />
    </HoverablePressable>
  )

  const renderCard = (size: { width: number; height: number }) => {
    const { containerStyle, maxHeight, arrowLeft, isBelow } = getPlacement(anchor, size, insets)

    return (
      // Keyed so the card mounts, and fades in, again when another tooltip replaces it
      <FadeInView
        key={activeTooltip.id}
        style={[{ position: 'absolute' }, containerStyle]}
        accessibilityViewIsModal
      >
        {arrowLeft !== null && (
          // A rotated square, half of it hidden behind the card
          <View
            style={[
              surfaceStyle,
              {
                position: 'absolute',
                left: arrowLeft,
                width: ARROW_SIZE,
                height: ARROW_SIZE,
                transform: [{ rotate: '45deg' }]
              },
              isBelow ? { top: -ARROW_SIZE / 2 } : { bottom: -ARROW_SIZE / 2 }
            ]}
          />
        )}
        <View
          style={[
            surfaceStyle,
            {
              maxHeight,
              borderRadius: BORDER_RADIUS_PRIMARY,
              paddingVertical: SPACING_SM,
              paddingHorizontal: SPACING_SM + 2
            }
          ]}
        >
          {!!title && (
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <InfoIcon width={18} height={18} color={theme.infoDecorative} />
              <Text fontSize={14} weight="semiBold" style={[flexbox.flex1, spacings.mlTy]}>
                {title}
              </Text>
              {closeButton}
            </View>
          )}
          {hasContent && (
            // Scrolls when the text is taller than the space next to the ⓘ
            <ScrollView
              style={[{ flexShrink: 1 }, !!title && { marginTop: SPACING_TY }]}
              // Without a title, the X sits in the top-right corner of the text
              contentContainerStyle={!title && { paddingRight: CLOSE_BUTTON_SIZE + SPACING_TY }}
              bounces={false}
            >
              {typeof children === 'string' ? (
                <Text fontSize={14} appearance="secondaryText">
                  {children}
                </Text>
              ) : (
                children
              )}
            </ScrollView>
          )}
          {!title && (
            <View style={{ position: 'absolute', top: SPACING_SM + 3, right: SPACING_SM + 2 }}>
              {closeButton}
            </View>
          )}
        </View>
      </FadeInView>
    )
  }

  return (
    <Portal hostName="global">
      {/* Native sheets present in their own window, which a z-index can't draw above */}
      <AboveSheetsOverlay>
        <FadeInView style={StyleSheet.absoluteFill}>
          <Pressable
            onPress={close}
            onLayout={handleOverlayLayout}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.backdrop, opacity: POPOVER_BACKDROP_OPACITY }
            ]}
            accessibilityLabel={t('Close')}
          />
        </FadeInView>
        {/* Placed once the overlay is measured, which only the first open waits for */}
        {!!overlaySize && renderCard(overlaySize)}
      </AboveSheetsOverlay>
    </Portal>
  )
}
