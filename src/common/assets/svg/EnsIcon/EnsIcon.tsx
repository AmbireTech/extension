import React from 'react'
import Svg, { Circle, G, Path } from 'react-native-svg'

import { LegendsSvgProps } from '@legends/types/svg'

export type EnsIconState = 'fresh' | 'none'

interface Props extends LegendsSvgProps {
  state?: EnsIconState
}

const EnsIcon: React.FC<Props> = ({
  width = 24,
  height = 24,
  state = 'fresh',
  color = '#0080BC',
  ...rest
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 202 231" fill="none" {...rest}>
      <G opacity={state === 'fresh' ? '1' : '0.5'}>
        <Path
          d="M98.3592 2.80337L34.8353 107.327C34.3371 108.147 33.1797 108.238 32.5617 107.505C26.9693 100.864 6.13478 72.615 31.9154 46.8673C55.4403 23.3726 85.4045 6.62129 96.5096 0.831705C97.7695 0.174847 99.0966 1.59007 98.3592 2.80337Z"
          fill={color}
        />
        <Path
          d="M94.8459 230.385C96.1137 231.273 97.6758 229.759 96.8261 228.467C82.6374 206.886 35.4713 135.081 28.9559 124.302C22.5295 113.67 9.88976 96.001 8.83534 80.8842C8.7301 79.3751 6.64332 79.0687 6.11838 80.4879C5.27178 82.7767 4.37045 85.5085 3.53042 88.6292C-7.07427 128.023 8.32698 169.826 41.7753 193.238L94.8459 230.386V230.385Z"
          fill={color}
        />
        <Path
          d="M103.571 228.526L167.095 124.003C167.593 123.183 168.751 123.092 169.369 123.825C174.961 130.465 195.796 158.715 170.015 184.463C146.49 207.957 116.526 224.709 105.421 230.498C104.161 231.155 102.834 229.74 103.571 228.526Z"
          fill={color}
        />
        <Path
          d="M107.154 0.930762C105.886 0.0433954 104.324 1.5567 105.174 2.84902C119.363 24.4301 166.529 96.2354 173.044 107.014C179.471 117.646 192.11 135.315 193.165 150.432C193.27 151.941 195.357 152.247 195.882 150.828C196.728 148.539 197.63 145.808 198.47 142.687C209.074 103.293 193.673 61.4905 160.225 38.078L107.154 0.930762Z"
          fill={color}
        />
      </G>
      {/* "?" overlay */}
      {state === 'none' && (
        <G transform="translate(101 126) scale(0.8) translate(-101 -126)">
          <Path
            d="M58 78C58 35 144 35 144 80C144 115 101 112 101 150"
            stroke={color}
            strokeWidth="30"
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx="101" cy="192" r="17" fill={color} />
        </G>
      )}
    </Svg>
  )
}

export default React.memo(EnsIcon)
