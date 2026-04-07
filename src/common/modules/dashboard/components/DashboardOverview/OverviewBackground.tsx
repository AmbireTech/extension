import { StyleSheet, View } from 'react-native'
import { Defs, FeBlend, FeColorMatrix, Filter, Image as SvgImage, Svg } from 'react-native-svg'

import useControllerState from '@common/hooks/useControllerState'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { getAvatarColors } from '@common/utils/avatars'

import backgroundImage from './background.png'

/** Parse a hex color to normalized [r, g, b] values (0–1) */
function hexToRgbNorm(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255
  ]
}

// How different are two colors perceptually? Returns 0 (same) to 1 (max contrast).
// Using luminance weights because our eyes are much more sensitive to green than blue.
function colorDistance(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgbNorm(hex1)
  const [r2, g2, b2] = hexToRgbNorm(hex2)
  return Math.sqrt(0.299 * (r1 - r2) ** 2 + 0.587 * (g1 - g2) ** 2 + 0.114 * (b1 - b2) ** 2)
}

// Builds a 4×5 SVG color matrix that takes one source channel (R=0, G=1, B=2)
// and outputs it as the given target color. Everything else goes black, so only
// the relevant tones in the image get recolored and the two layers don't bleed into each other.
function channelToColorMatrix(srcChannel: 0 | 1 | 2, tr: number, tg: number, tb: number): string {
  const row = (target: number) => {
    const r = [0, 0, 0, 0, 0]
    r[srcChannel] = target
    return r.join(' ')
  }
  return `${row(tr)} ${row(tg)} ${row(tb)} 0 0 0 1 0`
}

export function OverviewBackground({ address }: { address: string }) {
  const { state } = useControllerState({ id: 'WalletStateController' })
  const colors = getAvatarColors(state.avatarType, address)

  // Avatar colors[0] and colors[1] can sometimes be almost identical (e.g. two dark purples).
  // In that case, fall back to colors[2] as the secondary so the two layers actually look different.
  const DISTANCE_THRESHOLD = 0.2
  const d01 = colorDistance(colors[0], colors[1])
  const d02 = colorDistance(colors[0], colors[2])
  const secondary = d01 >= DISTANCE_THRESHOLD || d02 < d01 ? colors[1] : colors[2]

  const [r1, g1, b1] = hexToRgbNorm(colors[0])
  const [r2, g2, b2] = hexToRgbNorm(secondary)

  // Two matrices: one that maps the red tones in the image to the primary avatar color,
  // and one that maps the blue tones to the secondary. feBlend screen then combines them
  // so both colors show up without washing each other out.
  const matrix1 = channelToColorMatrix(0, r1, g1, b1)
  const matrix2 = channelToColorMatrix(2, r2, g2, b2)

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: '#000000',
          borderRadius: BORDER_RADIUS_PRIMARY,
          overflow: 'hidden'
        }
      ]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Filter id="recolor" x="0%" y="0%" width="100%" height="100%">
            <FeColorMatrix type="matrix" values={matrix1} in="SourceGraphic" result="layer1" />
            <FeColorMatrix type="matrix" values={matrix2} in="SourceGraphic" result="layer2" />
            <FeBlend in="layer1" in2="layer2" mode="screen" />
          </Filter>
        </Defs>

        <SvgImage
          href={backgroundImage}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          opacity={0.28}
          filter="url(#recolor)"
        />
      </Svg>
    </View>
  )
}
