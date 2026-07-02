import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import GlassView from '@common/components/GlassView'
import { isMobile } from '@common/config/env'
import { SPACING, SPACING_SM } from '@common/styles/spacings'
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
  glassViewProps?: Partial<React.ComponentProps<typeof GlassView>>
}> = ({
  children,
  style = {},
  mobileStyle = {},
  innerContainerStyle,
  size = 'md',
  glassViewProps = {},
  absolute = true,
  isSimpleBlur
}) => {
  const isCompactLayout = isSidePanel

  if (isMobile) {
    return (
      <View style={[{ flexDirection: 'column-reverse', width: '100%' }, mobileStyle]}>
        {children}
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
        ...(isCompactLayout ? { paddingHorizontal: SPACING_SM } : {}),
        ...style
      }}
    >
      <GlassView
        {...glassViewProps}
        isSimpleBlur={isSimpleBlur ?? glassViewProps.isSimpleBlur}
        borderRadius={Number(params[size].borderRadius)}
        cssStyle={{
          pointerEvents: 'all',
          ...(isCompactLayout ? { width: '100%' } : {}),
          ...(glassViewProps?.cssStyle || {})
        }}
      >
        <View
          style={[
            flexbox.directionRow,
            {
              paddingHorizontal: params[size].paddingHorizontal,
              paddingVertical: params[size].paddingVertical
            },
            isCompactLayout
              ? { width: '100%', gap: 4, alignItems: 'stretch' }
              : flexbox.alignCenter,
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
