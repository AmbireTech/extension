import React from 'react'
import Svg, { Circle, G, Path, Rect, SvgProps } from 'react-native-svg'

import { colorPalette as colors } from '@modules/common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
  withRect?: boolean
}

const MissingTokenIcon: React.FC<Props> = ({
  width = 34,
  height = 34,
  withRect = false,
  ...rest
}) => (
  <Svg width={width} height={height} viewBox="0 0 34 34" {...rest}>
    {withRect && (
      <Rect
        width="34"
        height="34"
        rx="13"
        transform="rotate(-90 17 17)"
        fill={colors.titan}
        opacity=".05"
      />
    )}
    <G transform="translate(-420 -531)">
      <Circle cx="11" cy="11" r="11" transform="translate(426 537)" fill="#d49c00" />
      <Path
        fill="#ffe499"
        d="M437 538a10 10 0 1 0 10 10 10.011 10.011 0 0 0-10-10m0-1a11 11 0 1 1-11 11 11 11 0 0 1 11-11Z"
      />
      <Path
        fill="#ffe499"
        d="M442.937 545.603h-11.91v-1.114l5.185-2.968.8-.459 5.924 3.427v1.113ZM437 541.75l-4.4 2.562h8.824l-4.425-2.562Z"
      />
      <Path fill="#ffe499" d="m434.225 544 2.763-1.6 2.825 1.6Z" />
      <Path fill="#ffe499" d="M431.643 545.875h1.713l-.225.688h-1.262Z" />
      <Path fill="#ffe499" d="M434.643 545.875h1.713l-.225.688h-1.262Z" />
      <Path fill="#ffe499" d="M437.643 545.875h1.713l-.225.688h-1.262Z" />
      <Path fill="#ffe499" d="M440.643 545.875h1.713l-.225.688h-1.262Z" />
      <Path fill="#ffe499" d="M431.643 551.123h1.713l-.225-.687h-1.262Z" />
      <Path fill="#ffe499" d="M434.643 551.123h1.713l-.225-.687h-1.262Z" />
      <Path fill="#ffe499" d="M437.643 551.123h1.713l-.225-.687h-1.262Z" />
      <Path fill="#ffe499" d="M440.643 551.123h1.713l-.225-.687h-1.262Z" />
      <Path fill="#ffe499" d="M431.993 546.75v3.412h1.075v-3.412Z" />
      <Path fill="#ffe499" d="M434.993 546.75v3.412h1.075v-3.412Z" />
      <Path fill="#ffe499" d="M437.993 546.75v3.412h1.075v-3.412Z" />
      <Path fill="#ffe499" d="M440.993 546.75v3.412h1.075v-3.412Z" />
      <Path fill="#ffe499" d="M430.381 552.528h13.275l-1.062-1.175h-11.225Z" />
      <Path
        fill="#ffe499"
        d="m436.766 556.087.244-.725.313.725h.725l-.663.538.263.725-.638-.513-.625.513.238-.725-.65-.538Z"
      />
      <Path
        fill="#ffe499"
        d="m436.766 539.375.244-.725.313.725h.725l-.663.538.263.725-.638-.513-.625.513.238-.725-.65-.538Z"
      />
      <Path
        fill="#ffe499"
        d="m441.656 540.975.244-.725.313.725h.725l-.663.538.263.725-.638-.513-.625.513.238-.725-.65-.538Z"
      />
      <Path
        fill="#ffe499"
        d="m431.876 540.975.244-.725.313.725h.725l-.663.538.263.725-.638-.513-.625.513.238-.725-.65-.538Z"
      />
      <Path
        fill="#ffe499"
        d="m428.876 545.275.244-.725.313.725h.725l-.663.538.263.725-.638-.513-.625.513.238-.725-.65-.538Z"
      />
      <Path
        fill="#ffe499"
        d="m428.876 550.409.244-.725.313.725h.725l-.663.538.263.725-.638-.513-.625.513.238-.725-.65-.538Z"
      />
      <Path
        fill="#ffe499"
        d="m432.014 554.575.244-.725.313.725h.725l-.663.538.263.725-.638-.513-.625.513.238-.725-.65-.538Z"
      />
      <Path
        fill="#ffe499"
        d="m444.644 545.275.244-.725.313.725h.725l-.663.538.263.725-.638-.513-.625.513.238-.725-.65-.538Z"
      />
      <Path
        fill="#ffe499"
        d="m444.644 550.409.244-.725.313.725h.725l-.663.538.263.725-.638-.513-.625.513.238-.725-.65-.538Z"
      />
      <Path
        fill="#ffe499"
        d="m441.484 554.575.244-.725.313.725h.725l-.663.538.263.725-.638-.513-.625.513.238-.725-.65-.538Z"
      />
    </G>
  </Svg>
)

export default MissingTokenIcon
