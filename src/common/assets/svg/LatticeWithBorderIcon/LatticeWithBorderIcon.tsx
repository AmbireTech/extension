import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const LatticeWithBorderIcon: React.FC<SvgProps> = ({ width = 57, height = 57, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 28 28">
      <G transform="translate(-2 -2)">
        <G
          transform="translate(2 2)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeWidth={1.3}
        >
          <Rect width={28} height={28} rx={14} stroke="none" />
          <Rect x={0.65} y={0.65} width={26.7} height={26.7} rx={13.35} fill="none" />
        </G>
        <G transform="translate(-59.34 -27.57)">
          <Path
            d="M502.487,41.383h-1.233V40.17h-1.031v1.213H498.99v.972h1.233v1.213h1.031V42.355h1.233Z"
            transform="translate(-417.147)"
            fill={color || theme.iconPrimary}
          />
          <Path
            d="M69.307,76.929a2.312,2.312,0,0,1-1,.208,1.8,1.8,0,0,1-1.86-1.821,1.751,1.751,0,0,1,1.867-1.791,2.394,2.394,0,0,1,1.343.37l.471-.849a3.151,3.151,0,0,0-1.86-.517,2.785,2.785,0,1,0-.023,5.564,3.264,3.264,0,0,0,2.068-.633V75.324h-1Z"
            transform="translate(0 -31.129)"
            fill={color || theme.iconPrimary}
          />
          <Path
            d="M228.787,74.017A2.012,2.012,0,0,0,226.524,72H224.53v5.585h1.1v-1.6h.961l1.088,1.6h1.294l-1.279-1.843A1.823,1.823,0,0,0,228.787,74.017Zm-2.359,1.009h-.8V72.962h.81c.723,0,1.215.389,1.215,1.056,0,.612-.484,1.009-1.223,1.009Z"
            transform="translate(-153.132 -30.619)"
            fill={color || theme.iconPrimary}
          />
          <Rect
            width={1.096}
            height={5.583}
            transform="translate(76.795 41.382)"
            fill={color || theme.iconPrimary}
          />
          <Path
            d="M433.239,74.84h0v-.168h-1.022v.168s-.011.406-.029.54c-.1.781-.846,1.236-1.793,1.236h-1.009V72.97H430.4V72h-2.11v5.585h2.152a2.528,2.528,0,0,0,2.8-2.2C433.251,75.246,433.239,74.84,433.239,74.84Z"
            transform="translate(-349.138 -30.619)"
            fill={color || theme.iconPrimary}
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(LatticeWithBorderIcon)
