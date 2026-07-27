import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import { useIsInsideBottomSheet } from '@common/components/BottomSheet/BottomSheetContext'
import GlassView from '@common/components/GlassView'
import { isMobile } from '@common/config/env'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import { SPACING, SPACING_MI, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

const { isSidePanel } = getUiType()

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
  /** Side-panel bottom sheets: use centered glass pill footer instead of flat full-width buttons. */
  preferGlassFooter?: boolean
  /**
   * When false, keeps the glass pill sized to its content (centered).
   * Defaults to stretching full-width on compact side-panel layouts.
   */
  fullWidth?: boolean
  glassViewProps?: Partial<React.ComponentProps<typeof GlassView>>
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
  fullWidth
}) => {
  const isInsideBottomSheet = useIsInsideBottomSheet()
  const { isCompactSidePanelLayout } = useCompactActionRequestLayout()
  // preferGlassFooter keeps the glass pill path by skipping the flat footer branch.
  const shouldUseCompactFlatFooter =
    isCompactSidePanelLayout && !preferGlassFooter && (isInsideBottomSheet || fullWidth === true)
  const shouldStretchFooter = shouldUseCompactFlatFooter || fullWidth === true
  const compactSidePanelInnerStyle: ViewStyle | undefined = shouldUseCompactFlatFooter
    ? {
        width: '100%',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: SPACING_TY,
        paddingHorizontal: params[size].paddingHorizontal,
        paddingVertical: params[size].paddingVertical,
        pointerEvents: 'auto'
      }
    : undefined

  if (isMobile) {
    return (
      <View style={[{ flexDirection: 'column-reverse', width: '100%' }, mobileStyle]}>
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
                  bottom: SPACING_SM,
                  zIndex: 3,
                  pointerEvents: 'none'
                }
              : { pointerEvents: 'auto' })
          },
          style
        ]}
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
      style={{
        position: absolute ? 'absolute' : 'relative',
        left: 0,
        bottom: absolute ? SPACING_SM : 0,
        width: '100%',
        ...flexbox.center,
        zIndex: 3,
        pointerEvents: 'none',
        ...style
      }}
    >
      <GlassView
        {...glassViewProps}
        isSimpleBlur={isSimpleBlur ?? glassViewProps.isSimpleBlur}
        borderRadius={Number(params[size].borderRadius)}
        cssStyle={{
          pointerEvents: 'all',
          // Side panel glass pills stay content-sized/centered; popup keeps v2 intrinsic sizing.
          ...(isSidePanel ? { width: 'fit-content', alignSelf: 'center' } : {}),
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
