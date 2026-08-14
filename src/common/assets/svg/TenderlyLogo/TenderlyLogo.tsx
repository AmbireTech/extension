import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Svg, { Path } from 'react-native-svg'

type Props = {
  width?: number
  height?: number
  style?: StyleProp<ViewStyle>
}

const TenderlyLogo: React.FC<Props> = ({ width = 18, height = 18, style }) => (
  <Svg width={width} height={height} style={style} viewBox="0 0 971.9 971.9">
    <Path
      fill="#6837ee"
      d="M489.35,670.69v301.2L241.62,833.6V600.27c-.07-159.15-49.74-256.8-112.52-328.96C66.35,199.17,0,143.65,0,143.65L262.62,295.3c74.96,42.96,226.64,171.44,226.73,375.39Z"
    />
    <Path
      fill="#cfc0ff"
      d="M262.62,295.3L0,143.65,244.64,0,446.6,117.68c137.79,80.21,247.36,86.67,341.48,68.99,94.09-17.68,183.82-45.36,183.82-45.36L707.71,289.79c-74.99,42.91-268.51,108.3-445.09,5.51Z"
    />
    <Path
      fill="#9273ff"
      d="M707.7,289.79l264.19-148.48v283.2L768.4,539.53c-138.77,78.52-199.44,169.77-231.43,259.83-31.98,90.03-47.62,172.54-47.62,172.54V670.7c.51-86.24,40.53-280.29,218.35-380.9Z"
    />
  </Svg>
)

export default React.memo(TenderlyLogo)
