import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const ActivityReceiveIcon: React.FC<Props> = ({ width = 15, height = 9 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.23852 14.8117C5.63734 16.3002 6.51616 17.6154 7.73867 18.5535C8.96118 19.4915 10.4591 20 12 20C13.5409 20 15.0388 19.4915 16.2613 18.5535C17.4838 17.6154 18.3627 16.3002 18.7615 14.8117"
        stroke="#96A1B1"
        stroke-width="1.5"
      />
      <Path
        d="M12 13L11.5315 13.5857L12 13.9605L12.4685 13.5857L12 13ZM12.75 4C12.75 3.58579 12.4142 3.25 12 3.25C11.5858 3.25 11.25 3.58579 11.25 4L12 4L12.75 4ZM7 9L6.53148 9.58565L11.5315 13.5857L12 13L12.4685 12.4143L7.46852 8.41435L7 9ZM12 13L12.4685 13.5857L17.4685 9.58565L17 9L16.5315 8.41435L11.5315 12.4143L12 13ZM12 13L12.75 13L12.75 4L12 4L11.25 4L11.25 13L12 13Z"
        fill="#96A1B1"
      />
    </Svg>
  )
}

export default React.memo(ActivityReceiveIcon)
