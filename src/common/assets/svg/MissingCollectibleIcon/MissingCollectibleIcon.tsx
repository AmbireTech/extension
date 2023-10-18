import React from 'react'
import Svg, { Circle, ClipPath, Defs, G, Path, Rect, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const MissingCollectibleIcon: React.FC<Props> = ({ width = '92', height = '92', ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 92 92" {...rest}>
    <Defs>
      <ClipPath id="a">
        <Path
          data-name="Subtraction 24"
          d="M81 92H11A11 11 0 0 1 0 81V11A11 11 0 0 1 11 0h29.926l-3.82 21.447 9.586 3.238-5.442 24.479 10.1-25.9-6.345-6.6L54.323 0H81a11 11 0 0 1 11 11v70a11 11 0 0 1-11 11Z"
          fill={colors.wooed}
          stroke={colors.chetwode}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </ClipPath>
      <ClipPath id="b">
        <Rect
          data-name="Rectangle 888"
          width="81.013"
          height="81.013"
          rx="8"
          fill={colors.chetwode}
        />
      </ClipPath>
    </Defs>
    <Path
      data-name="Subtraction 25"
      d="M81 92H11A11 11 0 0 1 0 81V11A11 11 0 0 1 11 0h29.926l-3.82 21.447 9.586 3.238-5.442 24.479 10.1-25.9-6.345-6.6L54.323 0H81a11 11 0 0 1 11 11v70a11 11 0 0 1-11 11Z"
      fill={colors.martinique}
    />
    <G data-name="Mask Group 22" clipPath="url(#a)">
      <G data-name="Mask Group 21" transform="translate(5.197 5.198)" clipPath="url(#b)">
        <Path
          data-name="Union 31"
          d="M-8.273 70.415a12 12 0 0 1 0-16.97l22.628-22.628a12 12 0 0 1 16.97 0l37.172 37.171-8.188-14.127 13.045-13.045a12 12 0 0 1 16.97 0l10.607 10.607a12 12 0 0 1 0 16.97L88.91 80.414c-3.45 3.45-6.366 4.489-9.534 2.926a11.967 11.967 0 0 1-3.504 8.995l-22.627 22.628a12 12 0 0 1-16.97 0Z"
          fill={colors.chetwode}
        />
      </G>
    </G>
    <G data-name="Subtraction 26" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M81 92H11A11 11 0 0 1 0 81V11A11 11 0 0 1 11 0h29.926l-3.82 21.447 9.586 3.238-5.442 24.479 10.1-25.9-6.345-6.6L54.323 0H81a11 11 0 0 1 11 11v70a11 11 0 0 1-11 11Z" />
      <Path
        d="M81 90a8.94 8.94 0 0 0 6.364-2.636A8.942 8.942 0 0 0 90 80.999V11a8.941 8.941 0 0 0-2.636-6.363A8.94 8.94 0 0 0 81 2H55.496l-8.02 14.34 5.32 5.535a2 2 0 0 1 .42 2.112L43.113 49.891a2 2 0 0 1-3.816-1.16l5.052-22.726-7.884-2.663a2 2 0 0 1-1.329-2.246L38.538 2H11a8.94 8.94 0 0 0-6.364 2.636A8.94 8.94 0 0 0 2 11v70c0 2.403.936 4.664 2.636 6.364A8.94 8.94 0 0 0 11 90h70m0 2H11c-2.938 0-5.7-1.144-7.778-3.222A10.93 10.93 0 0 1 0 80.999V11c0-2.937 1.144-5.7 3.222-7.777A10.928 10.928 0 0 1 11 0h29.926l-3.82 21.447 9.585 3.238-5.441 24.48L51.353 23.26l-6.345-6.604L54.323 0H81c2.938 0 5.7 1.144 7.778 3.222A10.928 10.928 0 0 1 92 11v70a10.93 10.93 0 0 1-3.222 7.778A10.927 10.927 0 0 1 81 92Z"
        fill={colors.wooed}
      />
    </G>
    <Circle
      data-name="Ellipse 194"
      cx="8"
      cy="8"
      r="8"
      transform="translate(63.064 9.057)"
      fill={colors.chetwode}
    />
  </Svg>
)

export default MissingCollectibleIcon
