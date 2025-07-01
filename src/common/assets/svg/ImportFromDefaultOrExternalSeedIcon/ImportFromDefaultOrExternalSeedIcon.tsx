import React from 'react'
import Svg, { Circle, G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ImportFromDefaultOrExternalSeedIcon: React.FC<SvgProps> = ({
  width = 39,
  height = 54,
  color,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 39 54" {...rest}>
      <G transform="translate(5814.775 17608.738)">
        <G
          transform="translate(-5814.775 -17593.738)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeWidth="2"
        >
          <Circle cx="19.5" cy="19.5" r="19.5" stroke="none" />
          <Circle cx="19.5" cy="19.5" r="18.5" fill="none" />
        </G>
        <G transform="translate(-5811.525 -17608.738)">
          <Path
            d="M6.322.315A.623.623,0,0,1,7.434.872L6.743,2.5a.623.623,0,0,0,.525.865l2.348.184a.623.623,0,0,1,0,1.243l-2.348.184a.623.623,0,0,0-.525.865l.691,1.627a.623.623,0,0,1-1.112.557L5.634,6.84a.623.623,0,0,0-1.078,0L3.869,8.023a.623.623,0,0,1-1.112-.557l.691-1.627a.623.623,0,0,0-.525-.865L.575,4.79a.623.623,0,0,1,0-1.243l2.348-.184A.623.623,0,0,0,3.448,2.5L2.757.872A.623.623,0,0,1,3.869.315L4.556,1.5a.623.623,0,0,0,1.078,0Z"
            transform="translate(8.338 0) rotate(90)"
            fill={color || theme.iconPrimary}
          />
          <Path
            d="M6.322.315A.623.623,0,0,1,7.434.872L6.743,2.5a.623.623,0,0,0,.525.865l2.348.184a.623.623,0,0,1,0,1.243l-2.348.184a.623.623,0,0,0-.525.865l.691,1.627a.623.623,0,0,1-1.112.557L5.634,6.84a.623.623,0,0,0-1.078,0L3.869,8.023a.623.623,0,0,1-1.112-.557l.691-1.627a.623.623,0,0,0-.525-.865L.575,4.79a.623.623,0,0,1,0-1.243l2.348-.184A.623.623,0,0,0,3.448,2.5L2.757.872A.623.623,0,0,1,3.869.315L4.556,1.5a.623.623,0,0,0,1.078,0Z"
            transform="translate(20.42 0) rotate(90)"
            fill={color || theme.iconPrimary}
          />
          <Path
            d="M6.322.315A.623.623,0,0,1,7.434.872L6.743,2.5a.623.623,0,0,0,.525.865l2.348.184a.623.623,0,0,1,0,1.243l-2.348.184a.623.623,0,0,0-.525.865l.691,1.627a.623.623,0,0,1-1.112.557L5.634,6.84a.623.623,0,0,0-1.078,0L3.869,8.023a.623.623,0,0,1-1.112-.557l.691-1.627a.623.623,0,0,0-.525-.865L.575,4.79a.623.623,0,0,1,0-1.243l2.348-.184A.623.623,0,0,0,3.448,2.5L2.757.872A.623.623,0,0,1,3.869.315L4.556,1.5a.623.623,0,0,0,1.078,0Z"
            transform="translate(32.502 0) rotate(90)"
            fill={color || theme.iconPrimary}
          />
        </G>
        <G transform="translate(-5808.275 -17588.051)">
          <Path
            d="M15.69,22.189a7.039,7.039,0,1,0-7.039-7.039A7.039,7.039,0,0,0,15.69,22.189Z"
            transform="translate(-2.689 -8.11)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <Path
            d="M32.273,25.172c0-5.069-5.812-9.2-13-9.2s-13,4.112-13,9.2"
            transform="translate(-6.271 1.31)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <G transform="translate(10.458 4.18)">
            <Path
              d="M29.321,271.68l2.543,2.543,2.543-2.543"
              transform="translate(-29.321 -268.04)"
              fill="none"
              stroke={color || theme.iconPrimary}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <Path
              d="M31.881,264v6.113"
              transform="translate(-29.339 -264)"
              fill="none"
              stroke={color || theme.iconPrimary}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </G>
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(ImportFromDefaultOrExternalSeedIcon)
