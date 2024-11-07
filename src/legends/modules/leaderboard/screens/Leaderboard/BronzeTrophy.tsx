import React from 'react'
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg'

type Props = {
  width?: number
  height?: number
  className?: string
}

const BronzeTrophy = ({ width = 22, height = 20, ...rest }: Props) => (
  <Svg width={width} height={height} viewBox="0 0 22 20" fill="none" {...rest}>
    <Defs>
      <LinearGradient
        id="a"
        x1=".25"
        y1=".043"
        x2=".716"
        y2=".961"
        gradientUnits="objectBoundingBox"
      >
        <Stop offset="0" stopColor="#f4cfab" />
        <stop offset="1" stopColor="#d08d4c" />
      </LinearGradient>
    </Defs>
    <G transform="translate(.5 .5)" fill="url(#a)">
      <Path d="M13.333 18.25H6.667a1.37 1.37 0 0 1-1.361-1.375c0-.758.61-1.375 1.36-1.375h.907c.588 0 1.066-.486 1.066-1.082 0-.597-.499-1.17-1.186-1.363-1.36-.38-3.314-1.163-4.903-2.727C.692 8.5-.25 6.067-.25 3.094A1.09 1.09 0 0 1 .833 2h3.404l-.011-.295A1.865 1.865 0 0 1 4.752.33c.36-.373.842-.579 1.36-.579h7.777c.517 0 1 .206 1.36.58.358.371.544.86.525 1.374L15.763 2h3.404c.597 0 1.083.49 1.083 1.094 0 2.971-.941 5.405-2.797 7.234-1.59 1.566-3.546 2.347-4.907 2.727-.687.19-1.185.763-1.185 1.363 0 .596.478 1.082 1.066 1.082h.906c.75 0 1.361.617 1.361 1.375a1.37 1.37 0 0 1-1.36 1.375ZM15.6 4.187c-.253 2.369-.745 4.346-1.464 5.895a7.992 7.992 0 0 0 1.803-1.32l.073-.072h.002c1.152-1.17 1.83-2.683 2.018-4.502H15.6Zm-13.626 0c.19 1.858.892 3.396 2.09 4.575a7.992 7.992 0 0 0 1.803 1.32c-.719-1.549-1.21-3.526-1.464-5.895H1.974Z" />
      <Path
        d="M6.111 0c-.92 0-1.67.766-1.635 1.695.007.186.014.372.024.555H.833A.837.837 0 0 0 0 3.094c0 3.255 1.163 5.52 2.726 7.056 1.538 1.515 3.413 2.278 4.795 2.664.812.229 1.368.915 1.368 1.604 0 .734-.59 1.332-1.316 1.332h-.906c-.615 0-1.111.503-1.111 1.125S6.052 18 6.666 18h6.667c.615 0 1.111-.503 1.111-1.125s-.496-1.125-1.11-1.125h-.907a1.326 1.326 0 0 1-1.316-1.332c0-.69.552-1.379 1.368-1.604 1.386-.386 3.26-1.15 4.799-2.664C18.837 8.613 20 6.35 20 3.094a.837.837 0 0 0-.833-.844H15.5c.01-.183.017-.366.024-.555A1.638 1.638 0 0 0 13.89 0H6.11m-4.41 3.938h2.927c.316 3.167 1.014 5.283 1.803 6.7-.865-.386-1.764-.931-2.542-1.698C2.778 7.847 1.875 6.268 1.7 3.938h-.003.003M16.118 8.94h-.003c-.778.767-1.677 1.312-2.542 1.698.788-1.417 1.486-3.533 1.802-6.7h2.93c-.177 2.33-1.08 3.909-2.187 5.002M6.111-.5h7.778a2.12 2.12 0 0 1 1.54.656 2.112 2.112 0 0 1 .594 1.594h3.144A1.34 1.34 0 0 1 20.5 3.094c0 3.04-.966 5.534-2.871 7.412-1.628 1.603-3.626 2.402-5.015 2.79-.573.158-1.003.64-1.003 1.122 0 .459.366.832.816.832h.906a1.62 1.62 0 0 1 1.611 1.625 1.62 1.62 0 0 1-1.61 1.625H6.666a1.62 1.62 0 0 1-1.611-1.625 1.62 1.62 0 0 1 1.61-1.625h.907c.45 0 .816-.373.816-.832 0-.48-.431-.961-1.004-1.122-1.387-.389-3.384-1.188-5.01-2.79C.467 8.63-.5 6.136-.5 3.094-.5 2.353.098 1.75.833 1.75h3.144v-.035A2.113 2.113 0 0 1 4.571.156 2.12 2.12 0 0 1 6.112-.5ZM4.18 4.438H2.255c.223 1.675.889 3.068 1.985 4.146.326.322.693.618 1.095.886-.545-1.398-.932-3.082-1.156-5.033Zm13.572 0h-1.927c-.223 1.95-.61 3.634-1.156 5.032a7.394 7.394 0 0 0 1.096-.886l.126-.125c1.02-1.06 1.645-2.41 1.86-4.021Z"
        fill="#8a6037"
      />
    </G>
  </Svg>
)

export default BronzeTrophy
