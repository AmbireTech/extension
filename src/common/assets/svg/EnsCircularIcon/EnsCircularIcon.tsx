import React, { FC } from 'react'
import { ClipPath, Defs, G, LinearGradient, Path, Stop, Svg, SvgProps } from 'react-native-svg'

const EnsCircularIcon: FC<SvgProps> = ({ width = 16, height = 16 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
      <G clipPath="url(#a)">
        <Path fill="url(#b)" d="M16 8A8 8 0 1 0 0 8a8 8 0 0 0 16 0Z" />
        <Path
          fill="#fff"
          d="M4.476 10.863a3.3 3.3 0 0 1-1.3-2.395 8.39 8.39 0 0 1-.034-.441c-.009-.26-.002-.52.019-.779a3.788 3.788 0 0 1 .348-1.106l.13-.249a1.607 1.607 0 0 0 0 .47 2.915 2.915 0 0 0 .34.978 102.128 102.128 0 0 0 3.697 5.751l-3.2-2.229Zm3.555 2.229 2.962-4.895v-.004s.257.436.36.659a2.089 2.089 0 0 1-.013 1.767c-.099.182-.24.337-.413.452l-2.896 2.02Zm4.06-3.51a1.5 1.5 0 0 0-.018-.234 2.881 2.881 0 0 0-.34-.98c-1.538-2.598-3.33-5.209-3.652-5.676l-.05-.073 3.207 2.23a3.295 3.295 0 0 1 1.299 2.392c.04.406.042.814.009 1.22a3.854 3.854 0 0 1-.346 1.107l-.13.247a1.49 1.49 0 0 0 .017-.232h.005ZM4.359 6.856a2.091 2.091 0 0 1 .014-1.766c.099-.183.24-.338.413-.453l2.9-2.018-2.971 4.897s-.26-.437-.361-.66h.005Z"
        />
      </G>
      <Defs>
        <LinearGradient id="b" x1="0" x2="16" y1="8.768" y2="8.832" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#513EFF" />
          <Stop offset=".204" stopColor="#5157FF" />
          <Stop offset=".606" stopColor="#5298FF" />
          <Stop offset="1" stopColor="#52E5FF" />
        </LinearGradient>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h16v16H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default React.memo(EnsCircularIcon)
