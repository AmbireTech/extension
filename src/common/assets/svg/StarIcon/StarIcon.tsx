import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  width?: number
  height?: number
  isFilled?: boolean
}

const StarIcon: React.FC<Props> = ({ width = 18, height = 18, isFilled }) => (
  <Svg width={width} height={height} viewBox="0 0 18 18">
    <Path
      id="Icon_material-star-border"
      data-name="Icon material-star-border"
      d="M21.947,9.859l-6.812-.587L12.474,3,9.812,9.281,3,9.859,8.173,14.34,6.619,21l5.855-3.534L18.328,21l-1.544-6.66Zm-9.474,5.836L8.912,17.845l.947-4.055L6.714,11.062l4.149-.36,1.611-3.818,1.62,3.827,4.149.36L15.1,13.8l.947,4.055Z"
      transform="translate(-3 -3)"
      fill={colors.titan}
      opacity="0.1"
    />
    <Path
      id="Icon_material-star"
      data-name="Icon material-star"
      d="M12.474,17.466,18.328,21l-1.554-6.66,5.173-4.481-6.812-.578L12.474,3,9.812,9.281,3,9.859,8.173,14.34,6.619,21Z"
      transform="translate(-3 -3)"
      fill={colors.mustard}
      opacity={isFilled ? '1' : '0'}
    />
  </Svg>
)

export default StarIcon
