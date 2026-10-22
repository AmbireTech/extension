import React, { FC, useId } from 'react'
import { Defs, G, LinearGradient, Path, Stop, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

type Star = {
  d: string
  // The two small stars are filled, the big one is an outline
  kind: 'fill' | 'stroke'
  gradient: { x1: number; y1: number; x2: number; y2: number }
}

type Drawing = {
  viewBoxSize: number
  stars: Star[]
}

// The design has two drawings of this icon, one for each size it comes in (24 and 36), instead of
// one that is scaled. The gradient runs from the top of each star to its bottom.
const SMALL_DRAWING: Drawing = {
  viewBoxSize: 24.7719,
  stars: [
    {
      d: 'M20.2396 0.879069C20.1743 0.706977 19.9308 0.706977 19.8656 0.879069L18.8928 3.44359C18.8725 3.4971 18.8303 3.53936 18.7767 3.55966L16.2124 4.53234C16.0403 4.59762 16.0403 4.84111 16.2124 4.90635L18.7767 5.87831C18.8302 5.89861 18.8725 5.94088 18.8928 5.99441L19.8655 8.55948C19.9308 8.73161 20.1743 8.73159 20.2395 8.55945L21.2115 5.99526C21.2318 5.94172 21.274 5.89945 21.3276 5.87915L23.8928 4.90638C24.0649 4.84112 24.0649 4.59766 23.8928 4.53238L21.3284 3.55966C21.2749 3.53936 21.2326 3.4971 21.2123 3.44359L20.2396 0.879069Z',
      kind: 'fill',
      gradient: { x1: 20.0526, y1: 0.38607, x2: 20.0526, y2: 9.05274 }
    },
    {
      d: 'M3.90623 18.2124C3.84095 18.0403 3.59751 18.0403 3.53223 18.2124L2.83448 20.0519C2.81418 20.1054 2.77193 20.1477 2.71841 20.168L0.879069 20.8657C0.706955 20.931 0.706984 21.1744 0.879113 21.2397L2.71837 21.9368C2.77191 21.9571 2.81418 21.9994 2.83449 22.0529L3.53218 23.8928C3.59745 24.0649 3.84096 24.0649 3.9062 23.8928L4.60333 22.0536C4.62363 22.0001 4.66589 21.9578 4.71943 21.9375L6.55948 21.2397C6.73159 21.1745 6.7316 20.931 6.5595 20.8657L4.72004 20.168C4.66653 20.1477 4.62428 20.1054 4.60398 20.0519L3.90623 18.2124Z',
      kind: 'fill',
      gradient: { x1: 3.71923, y1: 17.7194, x2: 3.71923, y2: 24.3861 }
    },
    {
      d: 'M15.77 9.11799L23.8928 12.199C24.0649 12.2643 24.0649 12.5078 23.8928 12.5731L15.7677 15.6541C15.7142 15.6744 15.6719 15.7167 15.6516 15.7703L12.5729 23.8928C12.5076 24.0649 12.2641 24.0649 12.1988 23.8928L9.11782 15.7679C9.09752 15.7144 9.05524 15.6721 9.0017 15.6518L0.879113 12.573C0.706984 12.5078 0.706955 12.2643 0.879069 12.199L9.00175 9.11799C9.05526 9.09769 9.09752 9.05544 9.11781 9.00192L12.1989 0.879069C12.2642 0.706977 12.5076 0.706977 12.5729 0.879069L15.654 9.00192C15.6743 9.05544 15.7165 9.09769 15.77 9.11799Z',
      kind: 'stroke',
      gradient: { x1: 12.3859, y1: 0.38607, x2: 12.3859, y2: 24.3861 }
    }
  ]
}

const LARGE_DRAWING: Drawing = {
  viewBoxSize: 36.7719,
  stars: [
    {
      d: 'M30.0729 0.879069C30.0076 0.706977 29.7642 0.706977 29.6989 0.879069L28.1303 5.01442C28.11 5.06794 28.0678 5.11019 28.0142 5.13049L23.8791 6.699C23.707 6.76429 23.707 7.00778 23.8791 7.07302L28.0142 8.64039C28.0677 8.66068 28.11 8.70295 28.1303 8.75649L29.6988 12.8928C29.7641 13.0649 30.0076 13.0649 30.0729 12.8928L31.6402 8.75776C31.6605 8.70422 31.7028 8.66195 31.7563 8.64165L35.8928 7.07305C36.0649 7.00779 36.0649 6.76433 35.8928 6.69905L31.7575 5.13049C31.704 5.11019 31.6618 5.06794 31.6415 5.01442L30.0729 0.879069Z',
      kind: 'fill',
      gradient: { x1: 29.8859, y1: 0.38607, x2: 29.8859, y2: 13.3861 }
    },
    {
      d: 'M5.57289 26.8791C5.50762 26.707 5.26417 26.707 5.1989 26.8791L4.04281 29.9269C4.02252 29.9804 3.98026 30.0227 3.92675 30.043L0.879069 31.199C0.706955 31.2643 0.706984 31.5078 0.879113 31.573L3.9267 32.7282C3.98024 32.7485 4.02252 32.7907 4.04282 32.8443L5.19885 35.8928C5.26412 36.0649 5.50762 36.0649 5.57287 35.8928L6.72801 32.8453C6.7483 32.7917 6.79057 32.7494 6.84411 32.7291L9.89281 31.5731C10.0649 31.5078 10.0649 31.2643 9.89283 31.199L6.84504 30.043C6.79153 30.0227 6.74928 29.9804 6.72898 29.9269L5.57289 26.8791Z',
      kind: 'fill',
      gradient: { x1: 5.3859, y1: 26.3861, x2: 5.3859, y2: 36.3861 }
    },
    {
      d: 'M23.42 13.468L35.8928 18.199C36.0649 18.2643 36.0649 18.5078 35.8928 18.5731L23.4166 23.3041C23.363 23.3244 23.3208 23.3667 23.3005 23.4203L18.5729 35.8928C18.5076 36.0649 18.2641 36.0649 18.1988 35.8928L13.4678 23.4167C13.4475 23.3632 13.4052 23.3209 13.3517 23.3006L0.879113 18.573C0.706984 18.5078 0.706955 18.2643 0.879069 18.199L13.3517 13.468C13.4053 13.4477 13.4475 13.4054 13.4678 13.3519L18.1989 0.879069C18.2642 0.706977 18.5076 0.706977 18.5729 0.879069L23.304 13.3519C23.3243 13.4054 23.3665 13.4477 23.42 13.468Z',
      kind: 'stroke',
      gradient: { x1: 18.3859, y1: 0.38607, x2: 18.3859, y2: 36.3861 }
    }
  ]
}

const LARGE_DRAWING_MIN_SIZE = 30
const STROKE_WIDTH = 1.5
// Where the gradient turns from its first to its second color, as a share of the star's height
const GRADIENT_SECOND_STOP_OFFSET = 0.697115

/**
 * Three sparkles with a gradient from the secondary to the primary accent color.
 * The drawing is a little bigger than its box, by the width of its outline, like in the design.
 * Its colors come from the theme, so `color` is not used.
 */
const SparklesIcon: FC<SvgProps> = ({ width = 24, height = 24, style }) => {
  const { theme } = useTheme()
  const gradientId = useId().replace(/:/g, '')
  const drawing = Number(width) >= LARGE_DRAWING_MIN_SIZE ? LARGE_DRAWING : SMALL_DRAWING
  const overflow = drawing.viewBoxSize - Number(width)

  return (
    <Svg
      width={drawing.viewBoxSize}
      height={Number(height) + overflow}
      viewBox={`0 0 ${drawing.viewBoxSize} ${drawing.viewBoxSize}`}
      fill="none"
      // The negative margin keeps the layout box at the requested size
      style={[{ margin: -overflow / 2 }, style]}
    >
      <Defs>
        {drawing.stars.map(({ gradient }, index) => (
          <LinearGradient
            key={index}
            id={`${gradientId}-${index}`}
            x1={gradient.x1}
            y1={gradient.y1}
            x2={gradient.x2}
            y2={gradient.y2}
            gradientUnits="userSpaceOnUse"
          >
            <Stop stopColor={theme.secondaryAccent200 as string} />
            <Stop
              offset={GRADIENT_SECOND_STOP_OFFSET}
              stopColor={theme.primaryAccent200 as string}
            />
          </LinearGradient>
        ))}
      </Defs>
      <G>
        {drawing.stars.map(({ d, kind }, index) => (
          <Path
            key={index}
            d={d}
            {...(kind === 'fill'
              ? { fill: `url(#${gradientId}-${index})` }
              : { stroke: `url(#${gradientId}-${index})`, strokeWidth: STROKE_WIDTH })}
          />
        ))}
      </G>
    </Svg>
  )
}

export default React.memo(SparklesIcon)
