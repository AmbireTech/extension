import React, { FC } from 'react'
import { LayoutChangeEvent, View, ViewStyle } from 'react-native'

import { useIsInsideBottomSheet } from '@common/components/BottomSheet/BottomSheetContext'
import GlassView from '@common/components/GlassView'
import { isMobile } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import { SPACING, SPACING_MI, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const params: {
  [key in 'sm' | 'md']: ViewStyle
} = {
  sm: {
    borderRadius: 28,
    paddingHorizontal: SPACING_SM,
    paddingVertical: SPACING_SM
  },
  md: {
    borderRadius: 32,
    paddingHorizontal: SPACING,
    paddingVertical: SPACING
  }
}

const FooterGlassView: FC<{
  children: React.ReactNode
  style?: ViewStyle
  mobileStyle?: ViewStyle
  innerContainerStyle?: ViewStyle
  size?: 'sm' | 'md'
  absolute?: boolean
  isSimpleBlur?: boolean
  /** Narrow-view bottom sheets: use centered glass pill footer instead of flat full-width buttons. */
  preferGlassFooter?: boolean
  /**
   * When false, keeps the glass pill sized to its content (centered).
   * Defaults to stretching full-width on compact narrow-view layouts.
   */
  fullWidth?: boolean
  glassViewProps?: Partial<React.ComponentProps<typeof GlassView>>
  // Reports the footer's rendered height, e.g. so a scroll container can reserve
  // exactly enough space to not be covered by this absolutely positioned footer
  onLayout?: (event: LayoutChangeEvent) => void
}> = ({
  children,
  style = {},
  mobileStyle = {},
  innerContainerStyle,
  size = 'md',
  glassViewProps = {},
  absolute = true,
  isSimpleBlur,
  preferGlassFooter = false,
  fullWidth,
  onLayout
}) => {
  const isInsideBottomSheet = useIsInsideBottomSheet()
  const { isNarrowWebLayout } = useCompactLayout()
  // preferGlassFooter keeps the glass pill path by skipping the flat footer branch.
  const shouldUseCompactFlatFooter =
    isNarrowWebLayout && !preferGlassFooter && (isInsideBottomSheet || fullWidth === true)
  const shouldStretchFooter = shouldUseCompactFlatFooter || fullWidth === true
  // Only stretch the glass pill when the call site opts in (e.g. TokenDetails).
  // Do not change the default centered narrow-view pill for other screens.
  const shouldStretchGlass = Boolean(
    glassViewProps?.cssStyle &&
      ((glassViewProps.cssStyle as ViewStyle).width === '100%' ||
        (glassViewProps.cssStyle as ViewStyle).alignSelf === 'stretch')
  )
  const compactSidePanelInnerStyle: ViewStyle | undefined = shouldUseCompactFlatFooter
    ? {
        width: '100%',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: SPACING_TY,
        // A bottom sheet already pads its content horizontally, so padding the footer too would
        // make the buttons narrower than everything above them
        paddingHorizontal: isInsideBottomSheet ? 0 : params[size].paddingHorizontal,
        paddingVertical: params[size].paddingVertical,
        // The bottom sheet already pads its bottom edge
        ...(isInsideBottomSheet ? { paddingBottom: 0 } : {}),
        pointerEvents: 'auto'
      }
    : undefined

  if (isMobile) {
    return (
      <View
        style={[{ flexDirection: 'column-reverse', width: '100%' }, mobileStyle]}
        onLayout={onLayout}
      >
        {children}
      </View>
    )
  }

  if (shouldUseCompactFlatFooter) {
    return (
      <View
        style={[
          {
            width: '100%',
            ...flexbox.center,
            ...(absolute
              ? {
                  position: 'absolute',
                  left: 0,
                  // Flush with the edge, so the inner padding makes the bottom spacing match the side one
                  bottom: 0,
                  zIndex: 3,
                  pointerEvents: 'none'
                }
              : { pointerEvents: 'auto' })
          },
          style
        ]}
        onLayout={onLayout}
      >
        <View
          style={[
            compactSidePanelInnerStyle ?? [
              flexbox.directionRow,
              {
                width: '100%',
                gap: SPACING_MI,
                paddingHorizontal: params[size].paddingHorizontal,
                paddingVertical: params[size].paddingVertical,
                pointerEvents: 'auto'
              },
              shouldStretchFooter ? { alignItems: 'stretch' } : flexbox.alignCenter
            ],
            innerContainerStyle
          ]}
        >
          {children}
        </View>
      </View>
    )
  }

  return (
    <View
      style={[
        {
          position: absolute ? 'absolute' : 'relative',
          left: 0,
          bottom: absolute ? SPACING_SM : 0,
          width: '100%',
          justifyContent: 'center',
          // Call-site width:100% glass needs stretch; center would keep the pill content-sized.
          alignItems: shouldStretchGlass ? 'stretch' : 'center',
          zIndex: 3,
          pointerEvents: 'none'
        },
        style
      ]}
      onLayout={onLayout}
    >
      <GlassView
        {...glassViewProps}
        isSimpleBlur={isSimpleBlur ?? glassViewProps.isSimpleBlur}
        borderRadius={Number(params[size].borderRadius)}
        cssStyle={{
          pointerEvents: 'all',
          // Narrow view glass pills stay content-sized/centered unless the call site opts into stretch.
          // Popup keeps v2 intrinsic sizing.
          ...(isNarrowWebLayout && !shouldStretchGlass
            ? { width: 'fit-content', alignSelf: 'center' }
            : {}),
          ...(glassViewProps?.cssStyle || {})
        }}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            {
              paddingHorizontal: params[size].paddingHorizontal,
              paddingVertical: params[size].paddingVertical
            },
            innerContainerStyle
          ]}
        >
          {children}
        </View>
      </GlassView>
    </View>
  )
}

export default FooterGlassView
