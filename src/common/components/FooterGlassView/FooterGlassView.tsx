import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import GlassView from '@common/components/GlassView'
import { SPACING, SPACING_SM } from '@common/styles/spacings'
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
  innerContainerStyle?: ViewStyle
  size?: 'sm' | 'md'
  absolute?: boolean
  isSimpleBlur?: boolean
  glassViewProps?: Partial<React.ComponentProps<typeof GlassView>>
}> = ({
  children,
  style = {},
  innerContainerStyle,
  size = 'md',
  glassViewProps = {},
  absolute = true,
  isSimpleBlur
}) => {
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
        isSimpleBlur={isSimpleBlur}
        borderRadius={Number(params[size].borderRadius)}
        cssStyle={{
          pointerEvents: 'all',
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
