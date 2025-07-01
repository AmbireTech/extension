import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ImportAccountIcon: React.FC<SvgProps> = ({
  width = 32,
  height = 32,
  color,
  strokeWidth = 1.5
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 32.186 32.259">
      <G transform="translate(0.75 0.75)">
        <G transform="translate(0 2.759)">
          <Path
            d="M12.792,16.392a4.141,4.141,0,1,0-4.141-4.141A4.141,4.141,0,0,0,12.792,16.392Z"
            transform="translate(1.148 -0.579)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M21.568,22.2c0-3.434-3.419-6.234-7.648-6.234S6.271,18.755,6.271,22.2"
            transform="translate(0.021 3.144)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M30,17A13.956,13.956,0,1,1,21.454,4.091a5.974,5.974,0,0,0-.295,1.857,5.778,5.778,0,0,0,.855,3.036,5.428,5.428,0,0,0,1.12,1.341,5.778,5.778,0,0,0,3.92,1.518,5.432,5.432,0,0,0,1.842-.31A14.1,14.1,0,0,1,30,17Z"
            transform="translate(-2.001 -3)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
        </G>
        <G transform="translate(19.132)">
          <Path
            d="M26.555,6.777a5.19,5.19,0,0,1-.173,1.343,5.393,5.393,0,0,1-.664,1.632,5.629,5.629,0,0,1-3.134,2.5,5.323,5.323,0,0,1-1.805.3,5.663,5.663,0,0,1-3.842-1.488,5.32,5.32,0,0,1-1.1-1.314A5.663,5.663,0,0,1,15,6.777a5.854,5.854,0,0,1,.289-1.82,5.7,5.7,0,0,1,1.343-2.21A5.769,5.769,0,0,1,20.778,1a5.7,5.7,0,0,1,4.289,1.921A5.754,5.754,0,0,1,26.555,6.777Z"
            transform="translate(-15.002 -1)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M21.815,4.98h-4.3"
            transform="translate(-13.886 0.769)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M19,3.52V7.838"
            transform="translate(-13.224 0.12)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeWidth={strokeWidth}
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(ImportAccountIcon)
