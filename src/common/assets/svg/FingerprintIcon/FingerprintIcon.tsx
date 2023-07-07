import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const FingerprintIcon: React.FC<Props> = ({ width = 90, height = 93 }) => (
  <Svg width={width} height={height} viewBox="0 0 89.999 93.858">
    <G transform="translate(17932.93 -8810.142)">
      <Path
        d="M24.588,59.332A44.26,44.26,0,0,1,7.87,49.458,30.608,30.608,0,0,1,1.522,40.9,24.487,24.487,0,0,1-1,30.082V7.123c1.237.1,1.99.166,3.2.166A33.917,33.917,0,0,0,12.8,5.664c6.081-2.106,12.6-6.909,12.6-6.908S31.925,3.562,38,5.664A38.6,38.6,0,0,0,48.579,7.909c1.211,0,.26.716,1.5.613L51.2,8.3v21.79a22.971,22.971,0,0,1-2.712,10.4,27.793,27.793,0,0,1-5.835,8.354,43.864,43.864,0,0,1-16.58,10.012h-.511Z"
        transform="translate(-17913.266 8840.521)"
        fill="#1e2033"
      />
      <Path
        d="M4.331,38.788h0A31.048,31.048,0,0,1,0,38.418V20.527A20.479,20.479,0,0,1,5.962,6.011a20.248,20.248,0,0,1,28.8,0,20.479,20.479,0,0,1,5.964,14.516V28.24a36.086,36.086,0,0,1-6.788-1.19V20.527a13.576,13.576,0,1,0-27.151,0v18.08A15.728,15.728,0,0,1,4.331,38.788Z"
        transform="translate(-17908.293 8810.144)"
        fill={colors.titan}
      />
      <Path
        d="M25.4,55.629a40.454,40.454,0,0,0,14.91-8.885,26.858,26.858,0,0,0,5.576-7.494,20.748,20.748,0,0,0,2.14-9.168V11.056A37.364,37.364,0,0,1,36.762,9.228,54.176,54.176,0,0,1,25.4,3.33a55.311,55.311,0,0,1-11.368,5.9A37.365,37.365,0,0,1,2.771,11.056V30.082a20.748,20.748,0,0,0,2.14,9.168,26.857,26.857,0,0,0,5.576,7.494A40.457,40.457,0,0,0,25.4,55.629m0,3.954-.809-.252A44.26,44.26,0,0,1,7.87,49.458,30.608,30.608,0,0,1,1.522,40.9,24.488,24.488,0,0,1-1,30.082V7.123c1.237.1,1.99.166,3.2.166A33.917,33.917,0,0,0,12.8,5.664c6.081-2.106,12.6-6.908,12.6-6.908h0S31.925,3.562,38,5.664a33.917,33.917,0,0,0,10.6,1.625c1.211,0,1.964-.062,3.2-.165V30.082A24.488,24.488,0,0,1,49.272,40.9a30.609,30.609,0,0,1-6.348,8.554,44.262,44.262,0,0,1-16.75,9.883Z"
        transform="translate(-17913.26 8840.522)"
        fill="#27e8a7"
      />
      <Rect width="89.999" height="89.999" transform="translate(-17932.93 8814)" fill="none" />
      <G transform="translate(-17905.09 8852.958)">
        <Path
          d="M27.176,7.532a.767.767,0,0,1-.329-.079,16.714,16.714,0,0,0-15.929-.007.717.717,0,1,1-.686-1.258A18.168,18.168,0,0,1,27.5,6.181a.715.715,0,0,1-.329,1.351ZM6.714,15.039A.745.745,0,0,1,6.3,14.91a.712.712,0,0,1-.172-.994A14.893,14.893,0,0,1,11.5,9.233a16.5,16.5,0,0,1,14.75-.014,14.959,14.959,0,0,1,5.362,4.647.71.71,0,0,1-.164.994.719.719,0,0,1-1-.164,13.424,13.424,0,0,0-4.847-4.2,15.045,15.045,0,0,0-13.441.014A13.427,13.427,0,0,0,7.3,14.746a.728.728,0,0,1-.586.293Zm8.944,17.252a.71.71,0,0,1-.508-.214,14.984,14.984,0,0,1-2.874-3.768A12.724,12.724,0,0,1,10.768,22.1a7.921,7.921,0,0,1,8.1-7.707,7.916,7.916,0,0,1,8.1,7.707.715.715,0,0,1-1.43,0,6.488,6.488,0,0,0-6.671-6.277A6.493,6.493,0,0,0,12.2,22.1a11.326,11.326,0,0,0,1.323,5.512,13.555,13.555,0,0,0,2.638,3.46.706.706,0,0,1-.007,1.008.641.641,0,0,1-.493.214ZM25.9,29.646a7.767,7.767,0,0,1-4.433-1.265,7.624,7.624,0,0,1-3.4-6.277.715.715,0,0,1,1.43,0,6.187,6.187,0,0,0,6.4,6.113A9.385,9.385,0,0,0,27.4,28.08a.715.715,0,1,1,.25,1.408,10.239,10.239,0,0,1-1.744.157ZM23.022,32.6a.533.533,0,0,1-.186-.029,10.92,10.92,0,0,1-5.312-3,10.468,10.468,0,0,1-3.1-7.464,4.409,4.409,0,0,1,8.808,0,2.981,2.981,0,0,0,5.948,0c0-5.391-4.647-9.773-10.36-9.773a10.431,10.431,0,0,0-9.452,5.763A9.185,9.185,0,0,0,8.537,22.1a14.266,14.266,0,0,0,.951,5.155.717.717,0,1,1-1.344.5A15.921,15.921,0,0,1,7.1,22.1a10.587,10.587,0,0,1,.979-4.626,11.876,11.876,0,0,1,10.739-6.57c6.5,0,11.79,5.026,11.79,11.2a4.409,4.409,0,0,1-8.808,0,2.981,2.981,0,0,0-5.948,0,9.046,9.046,0,0,0,2.674,6.449A9.646,9.646,0,0,0,23.208,31.2a.713.713,0,0,1-.186,1.4Z"
          transform="translate(-1.709 -1.14)"
          fill="#a36af8"
        />
        <Path d="M0,0H34.318V34.318H0Z" fill="none" />
      </G>
    </G>
  </Svg>
)

export default FingerprintIcon
