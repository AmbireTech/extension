import React, { FC } from 'react'
import Svg, { Defs, LinearGradient, Path, Rect, Stop, SvgProps } from 'react-native-svg'

const RewardsCircularIcon: FC<SvgProps> = ({ width, height, ...rest }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 14 14" fill="none" {...rest}>
      <Defs>
        <LinearGradient
          id="rewards-circular"
          x1="5.805"
          x2="13.382"
          y1="8.75"
          y2="-1.221"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#D7FF00" />
          <Stop offset="1" stopColor="#93AB0D" />
        </LinearGradient>
      </Defs>
      <Rect width="14" height="14" fill="url(#rewards-circular)" rx="7" />
      <Path
        fill="#191A1F"
        d="m5.82 2.832-.702 2.043a.091.091 0 0 0 .005.07l.656 1.322-1.803 1.047a.043.043 0 0 1-.061-.02l-.39-.831a.092.092 0 0 1 .006-.089l2.274-3.55a.009.009 0 0 1 .011-.003.01.01 0 0 1 .005.01ZM9.352 5.57l1.493 3.26a.092.092 0 0 1-.018.103L6.9 12.82a.043.043 0 0 1-.048.009.044.044 0 0 1-.02-.017.046.046 0 0 1-.007-.024V9.213l2.476-2.449a.09.09 0 0 0 .027-.064l.007-1.128c0-.002 0-.004.002-.006a.009.009 0 0 1 .01-.002l.005.004Z"
      />
      <Path
        fill="#191A1F"
        d="M6.858 1.178 8.517 5.34a.091.091 0 0 1-.001.07l-2.678 6.422a.045.045 0 0 1-.032.027.043.043 0 0 1-.04-.012l-2.463-2.44a.09.09 0 0 1-.01-.117l3.514-4.88a.091.091 0 0 0 .018-.053V1.185c0-.004.001-.008.004-.012a.017.017 0 0 1 .021-.004.018.018 0 0 1 .008.009Z"
      />
    </Svg>
  )
}

export default RewardsCircularIcon
