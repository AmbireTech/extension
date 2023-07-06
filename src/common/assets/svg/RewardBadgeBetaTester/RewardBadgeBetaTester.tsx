import React from 'react'
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const RewardBadgeBetaTester: React.FC<Props> = ({ width = 82.074, height = 93.633, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 82.074 93.633" {...rest}>
    <Defs>
      <LinearGradient
        id="b"
        x1={0.5}
        y1={0.049}
        x2={0.5}
        y2={0.959}
        gradientUnits="objectBoundingBox"
      >
        <Stop offset={0} stopColor="#3e436b" />
        <Stop offset={1} stopColor="#2d314d" />
      </LinearGradient>
      <LinearGradient
        id="c"
        x1={0.155}
        y1={0.839}
        x2={0.893}
        y2={-0.346}
        gradientUnits="objectBoundingBox"
      >
        <Stop offset={0} stopColor="#6000ff" />
        <Stop offset={0.198} stopColor="#6507ff" />
        <Stop offset={0.493} stopColor="#711cff" />
        <Stop offset={0.848} stopColor="#863dff" />
        <Stop offset={1} stopColor="#904dff" />
      </LinearGradient>
    </Defs>
    <G transform="translate(-.003)" filter="url(#a)">
      <Path
        data-name="shadow"
        d="M263.927 417.165a32.041 32.041 0 01-32.037-32.037V360.32a9.368 9.368 0 016.228-8.816l23.055-7.668a8.732 8.732 0 015.508 0l23.072 7.673a9.363 9.363 0 016.211 8.811v24.809a32.041 32.041 0 01-32.037 32.037z"
        transform="translate(-222.89 -342.53)"
        fill="url(#b)"
      />
    </G>
    <Path
      data-name="base"
      d="M263.927 417.165a32.041 32.041 0 01-32.037-32.037V360.32a9.368 9.368 0 016.228-8.816l23.055-7.668a8.732 8.732 0 015.508 0l23.072 7.673a9.363 9.363 0 016.211 8.811v24.809a32.041 32.041 0 01-32.037 32.037z"
      transform="translate(-222.89 -342.533)"
      fill="url(#b)"
    />
    <Path
      d="M41.037 1.71a8 8 0 012.486.4l23.055 7.668a8.514 8.514 0 015.645 8v24.809a31.18 31.18 0 11-62.36 0v-24.8a8.522 8.522 0 015.639-8L38.557 2.11a7.906 7.906 0 012.48-.4m0-1.714a9.631 9.631 0 00-3.028.491L14.937 8.16a10.216 10.216 0 00-6.8 9.622v24.809a32.9 32.9 0 0014.77 27.454 32.885 32.885 0 0036.248 0 32.9 32.9 0 0014.77-27.454V17.787a10.21 10.21 0 00-6.8-9.622L44.057.491A9.508 9.508 0 0041.04 0z"
      fill="#6770b3"
    />

    <Path
      data-name="Path 1783"
      d="M44.734 28.694v-8.039a.383.383 0 01.383-.383.573.573 0 00.571-.571v-.743a.573.573 0 00-.571-.571h-8.166a.573.573 0 00-.571.571v.743a.573.573 0 00.571.571.383.383 0 01.383.383v8.039a12.779 12.779 0 107.4 0z"
      fill="#98a1ed"
    />
    <Path
      data-name="Path 1784"
      d="M47.299 31.608a13.017 13.017 0 014.725 7.988l-2.64.337-1.518-1.565a21.581 21.581 0 00-4.548-8.719 23.743 23.743 0 013.981 1.959z"
      fill="#ebecff"
    />
    <Path
      data-name="Path 1785"
      d="M278.3 409.04c-5.451 1.44-8.925.457-12.2-1.8a12.779 12.779 0 1025.043 3.588c-1.675-1.56-4.943-3.879-12.843-1.788z"
      transform="translate(-237.33 -369.902)"
      fill="url(#c)"
    />
    <Path
      data-name="Path 1786"
      d="M47.864 38.361a13.173 13.173 0 01.223 2.388 13 13 0 01-9.919 12.627 12.23 12.23 0 002.057.309 12.784 12.784 0 0013.603-12.754 9.407 9.407 0 00-5.964-2.57z"
      fill="#ae60ff"
    />
    <Path
      data-name="Path 1787"
      d="M52.024 39.589a11.222 11.222 0 01.086 1.326 11.079 11.079 0 11-22.158 0 10.932 10.932 0 01.331-2.645 16.855 16.855 0 01-1.514-.931 12.779 12.779 0 1025.043 3.588 9.614 9.614 0 00-1.788-1.338z"
      fill="#40169b"
    />
    <Circle
      data-name="Ellipse 151"
      cx={2.348}
      cy={2.348}
      r={2.348}
      fill="#ae50ff"
      transform="translate(33.986 37.802)"
    />
    <Circle
      data-name="Ellipse 152"
      cx={1.771}
      cy={1.771}
      r={1.771}
      fill="#ae50ff"
      transform="translate(40.202 33.196)"
    />
    <Circle
      data-name="Ellipse 153"
      cx={0.777}
      cy={0.777}
      r={0.777}
      fill="#ae50ff"
      transform="translate(44.51 35.448)"
    />
    <Circle
      data-name="Ellipse 154"
      cx={0.777}
      cy={0.777}
      r={0.777}
      fill="#ae50ff"
      transform="translate(40.397 26.58)"
    />
    <Circle
      data-name="Ellipse 155"
      cx={0.777}
      cy={0.777}
      r={0.777}
      fill="#c792ff"
      transform="translate(49.064 18.975)"
    />
    <Circle
      data-name="Ellipse 156"
      cx={0.851}
      cy={0.851}
      r={0.851}
      fill="#c792ff"
      transform="translate(31.386 18.387)"
    />
    <Circle
      data-name="Ellipse 157"
      cx={0.594}
      cy={0.594}
      r={0.594}
      fill="#c792ff"
      transform="translate(40.796 11.97)"
    />
    <Circle
      data-name="Ellipse 158"
      cx={1.051}
      cy={1.051}
      r={1.051}
      fill="#ae50ff"
      transform="translate(34.529 13.53)"
    />
    <Circle
      data-name="Ellipse 159"
      cx={1.234}
      cy={1.234}
      r={1.234}
      fill="#ae50ff"
      transform="translate(39.202 22.706)"
    />
    <Circle
      data-name="Ellipse 160"
      cx={1.234}
      cy={1.234}
      r={1.234}
      fill="#ae50ff"
      transform="translate(45.573 15.021)"
    />
    <Circle
      data-name="Ellipse 161"
      cx={1.851}
      cy={1.851}
      r={1.851}
      fill="#ae50ff"
      transform="translate(38.425 15.033)"
    />
    <Path
      data-name="Path 1788"
      d="M44.734 28.694v-8.039a.383.383 0 01.383-.383h0a.573.573 0 00.571-.571v-.743a.573.573 0 00-.571-.571h-8.166a.573.573 0 00-.571.571v.743a.573.573 0 00.571.571h0a.383.383 0 01.383.383v8.039a12.779 12.779 0 107.4 0z"
      fill="none"
      stroke="#24263d"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      data-name="Path 3023"
      d="M33.701 66h1.58l-1.84-2.78 1.82-2.76h-1.5l-1.02 1.71-1.13-1.71h-1.58l1.83 2.76-1.81 2.78h1.5l1.01-1.72zm2.98 0h1.44v-7.29h-2.41V60h.97zm4.45-.75a.818.818 0 00-.85-.82.824.824 0 00-.87.82.824.824 0 00.87.82.818.818 0 00.85-.82zm.89.65h4.94v-1.16h-2.95c1.16-.98 2.79-2.3 2.79-3.99a2.105 2.105 0 00-2.36-2.2 2.292 2.292 0 00-2.43 2.44h1.36c.01-.77.38-1.25 1.05-1.25.69 0 .98.44.98 1.09 0 1.34-1.73 2.63-3.38 4.03zm6.2-7.21v4.28h1.34a1.09 1.09 0 011.1-.77 1.108 1.108 0 011.2 1.27c0 .77-.37 1.35-1.19 1.35a1.14 1.14 0 01-1.21-.88h-1.36a2.323 2.323 0 002.59 2.06 2.34 2.34 0 002.52-2.55 2.194 2.194 0 00-2.28-2.41 1.9 1.9 0 00-1.43.59v-1.71h3.24v-1.23z"
      fill="#ebecff"
    />
  </Svg>
)

export default RewardBadgeBetaTester
