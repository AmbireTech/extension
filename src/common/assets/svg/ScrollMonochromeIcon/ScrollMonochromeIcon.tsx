import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const ScrollMonochromeIcon: React.FC<Props> = ({ width = 18.578, height = 18.286 }) => (
  <Svg width={width} height={height} viewBox="0 0 18.578 18.286">
    <Path
      d="M2.319,7.049A3.539,3.539,0,0,1,1.1,4.459V4.346A3.387,3.387,0,0,1,4.369,1.1H15.606a.524.524,0,0,1,.518.518v9.526a6.449,6.449,0,0,1,.631.158,3.181,3.181,0,0,1,.473.225V1.621A1.648,1.648,0,0,0,15.583,0H4.369A4.451,4.451,0,0,0,0,4.459,4.4,4.4,0,0,0,1.689,7.927a.4.4,0,0,0,.338.135.519.519,0,0,0,.54-.54A.53.53,0,0,0,2.319,7.049Z"
      transform="translate(0 0)"
      fill="#51588c"
    />
    <Path
      d="M24.456,23.477H15.651a1.062,1.062,0,0,0-1.058,1.081v1.261A1.131,1.131,0,0,0,15.7,26.9h.653V25.819H15.7V24.581h.36a2.073,2.073,0,0,1,1.937,2.139,2.219,2.219,0,0,1-4.436,0V15.978a.894.894,0,0,0-.878-.878H11.8v1.1h.653V26.742a3.017,3.017,0,0,0,3.153,3.22l8.873.023a3.244,3.244,0,0,0,3.243-3.243A3.282,3.282,0,0,0,24.456,23.477Zm2.139,3.31a2.155,2.155,0,0,1-2.139,2.072l-6.17-.023a3.19,3.19,0,0,0,.788-2.117,3.594,3.594,0,0,0-.743-2.139h6.148a2.153,2.153,0,0,1,2.139,2.139Z"
      transform="translate(-9.143 -11.7)"
      fill="#51588c"
    />
    <Path
      d="M34.643,17.081H28V16h6.643a.548.548,0,0,1,.54.54A.533.533,0,0,1,34.643,17.081Z"
      transform="translate(-21.695 -12.397)"
      fill="#51588c"
    />
    <Path
      d="M34.643,40H28V38.9h6.643a.548.548,0,0,1,.54.54A.539.539,0,0,1,34.643,40Z"
      transform="translate(-21.695 -30.14)"
      fill="#51588c"
    />
    <Path
      d="M35.814,28.5H28V27.4h7.814a.552.552,0,0,1,0,1.1Z"
      transform="translate(-21.695 -21.23)"
      fill="#51588c"
    />
  </Svg>
)

export default ScrollMonochromeIcon
