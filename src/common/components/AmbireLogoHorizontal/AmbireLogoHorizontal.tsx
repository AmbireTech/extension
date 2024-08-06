import React from 'react'
import { Defs, G, LinearGradient, Path, Stop, Svg, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

interface Props extends SvgProps {
  color?: string
}

const AmbireLogoHorizontal: React.FC<Props> = ({
  width = 84.872,
  height = 40,
  color = colors.titan,
  ...rest
}) => {

  // Temporary fix for the onClick event
  // Discussion here:
  // {@ link} https://github.com/expo/expo/issues/26829
  if (rest.onClick) delete rest.onClick
  return (
    <Svg width={width} height={height} viewBox="0 0 84.872 40" {...rest}>
      <Defs>
        <LinearGradient
          id="linear-gradient"
          x1="0.554"
          y1="0.58"
          x2="0.052"
          y2="0.409"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#6000ff" />
          <Stop offset="0.651" stopColor="#4900c3" />
          <Stop offset="1" stopColor="#320086" />
        </LinearGradient>
        <LinearGradient
          id="linear-gradient-2"
          x1="0.06"
          y1="-0.087"
          x2="0.486"
          y2="0.653"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#6a0aff" />
          <Stop offset="0.047" stopColor="#8c2dff" />
          <Stop offset="0.102" stopColor="#6a0aff" />
          <Stop offset="0.902" stopColor="#af50ff" />
          <Stop offset="1" stopColor="#af50ff" />
        </LinearGradient>
        <LinearGradient
          id="linear-gradient-3"
          x1="1.071"
          y1="0.062"
          x2="0.095"
          y2="1.049"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#6a0aff" />
          <Stop offset="0.51" stopColor="#8c2dff" />
          <Stop offset="0.969" stopColor="#af50ff" />
          <Stop offset="1" stopColor="#af50ff" />
        </LinearGradient>
        <LinearGradient
          id="linear-gradient-4"
          x1="0.448"
          y1="0.297"
          x2="0.538"
          y2="0.8"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#6000ff" />
          <Stop offset="1" stopColor="#3e00a5" />
        </LinearGradient>
        <LinearGradient
          id="linear-gradient-5"
          x1="-0.529"
          y1="1.069"
          x2="1.092"
          y2="0.86"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#ae60ff" />
          <Stop offset="0.322" stopColor="#af50ff" />
          <Stop offset="1" stopColor="#6000ff" />
        </LinearGradient>
        <LinearGradient
          id="linear-gradient-6"
          x1="-0.111"
          y1="0.274"
          x2="0.872"
          y2="1.224"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#6f0fff" />
          <Stop offset="0.702" stopColor="#af50ff" />
          <Stop offset="1" stopColor="#af50ff" />
        </LinearGradient>
        <LinearGradient
          id="linear-gradient-7"
          x1="0.015"
          y1="0.007"
          x2="0.985"
          y2="0.95"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#ae60ff" />
          <Stop offset="0.031" stopColor="#b670fa" />
          <Stop offset="1" stopColor="#be80f5" />
        </LinearGradient>
      </Defs>
      <G id="logo-ambire-wallet-hor" transform="translate(-0.013 0.01)">
        <G id="_1967776972864" transform="translate(0.013 -0.01)">
          <Path
            id="Path_1980"
            d="M1321.726,796.161l-.881-1.672h-3.985l-.881,1.672h-1.969q2.011-3.736,4.024-7.471h1.677l4.034,7.471h-2.02Zm-2.874-5.442-1.2,2.255h2.383l-1.188-2.255Zm5.9,5.442V788.69h1.812l3.194,4.468,3.165-4.468h1.8v7.471h-1.745v-4.8l-2.521,3.61h-1.43L1326.5,791.4v4.76Zm17.512,0h-5.327V788.69h5.177a2.983,2.983,0,0,1,1.839.523,1.8,1.8,0,0,1,.705,1.491,1.82,1.82,0,0,1-.833,1.568,2.093,2.093,0,0,1,.692.509,1.839,1.839,0,0,1,.451,1.247,1.909,1.909,0,0,1-.739,1.587A3.182,3.182,0,0,1,1342.262,796.161Zm.357-5.8a1.225,1.225,0,0,0-.757-.194h-3.121v1.477h3.131a1.143,1.143,0,0,0,.733-.213.677.677,0,0,0,.236-.546.629.629,0,0,0-.222-.524Zm.219,2.987a1.383,1.383,0,0,0-.845-.219h-3.251v1.558h3.281a1.373,1.373,0,0,0,.83-.2.657.657,0,0,0,.239-.556A.694.694,0,0,0,1342.837,793.346Zm3.821,2.814V788.69h1.835v7.471Zm4.047,0V788.69h4.846a3.04,3.04,0,0,1,2.035.633,2.277,2.277,0,0,1,.75,1.8,2.228,2.228,0,0,1-.665,1.673,2.606,2.606,0,0,1-1.343.642l2.527,2.722h-2.344l-2.372-2.572h-1.6v2.572H1350.7Zm5.523-5.7a1.416,1.416,0,0,0-.907-.241h-2.781v1.848h2.781a1.416,1.416,0,0,0,.9-.243.825.825,0,0,0,.276-.676.842.842,0,0,0-.273-.688Zm3.889,5.7V788.69h7.151v1.525h-5.345v1.378h4.714v1.515h-4.714v1.528h5.345v1.525h-7.151Z"
            transform="translate(-1282.396 -769.714)"
            fill={color}
            fillRule="evenodd"
          />
          <Path
            id="Path_1981"
            d="M1317.115,1208.172h-1.056l-2.049-5.332h1.4l1.292,3.58,1.424-3.58h1.18l1.438,3.569,1.293-3.569h1.385l-2.057,5.332h-1.188l-1.475-3.634-1.475,3.634Zm12.291,0h-1.164l-.629-1.193h-2.845l-.629,1.193h-1.4q1.436-2.666,2.871-5.332h1.2q1.438,2.667,2.879,5.332Zm-3.215-3.885-.854,1.61h1.7Zm8.726,3.885H1330.4v-5.332h1.309v4.222h3.372v1.11Zm5.675,0h-4.516v-5.332h1.309v4.222h3.372v1.11Zm6.1,0h-4.938v-5.332h5.053v1.088h-3.765v.984h3.365v1.081h-3.365v1.091h3.815v1.088h-.166Zm4.146,0h-1.144v-4.222h-2.272v-1.11h5.868v1.11H1351v4.222h-.165Z"
            transform="translate(-1282.396 -1173.899)"
            fill={color}
          />
          <G id="Group_1020" transform="translate(0 0)">
            <Path
              id="Path_1982"
              d="M527.212,626.6l5.249,11.174a.316.316,0,0,1-.065.348L518.589,651.46a.153.153,0,0,1-.259-.116V639.087l8.7-8.4a.282.282,0,0,0,.09-.219l.026-3.871c0-.026.052-.026.065,0Z"
              transform="translate(-505.859 -611.502)"
              fill="#6000ff"
            />
            <Path
              id="Path_1983"
              d="M518.34,804.072v12.258a.153.153,0,0,0,.259.116h0L532.407,803.1a.316.316,0,0,0,.065-.348h0l-5.391-7.126Z"
              transform="translate(-505.869 -776.487)"
              fillRule="evenodd"
              fill="url(#linear-gradient)"
            />
            <Path
              id="Path_1984"
              d="M881.716,626.01h0a.03.03,0,0,0-.031.031h0l-.022,3.87a.318.318,0,0,1-.051.18l5.412,7.3A.336.336,0,0,0,887,637.2h0l-5.249-11.174a.036.036,0,0,0-.031-.018h0Z"
              transform="translate(-860.399 -610.948)"
              fillRule="evenodd"
              fill="url(#linear-gradient-2)"
            />
            <Path
              id="Path_1985"
              d="M896.284,815.426a.337.337,0,0,0-.026-.194h0l-.272-.58L891.1,808.43l5.184,7Z"
              transform="translate(-869.661 -788.979)"
              fill="#be80f5"
              fillRule="evenodd"
            />
            <Path
              id="Path_1986"
              d="M42.587,235.528l-2.469,6.993a.324.324,0,0,0,.013.245l2.3,4.529L36.1,250.882a.166.166,0,0,1-.22-.064l-1.37-2.852a.274.274,0,0,1,.026-.3l7.99-12.18a.039.039,0,0,1,.065.039Z"
              transform="translate(-33.645 -229.814)"
              fill="#6000ff"
            />
            <Path
              id="Path_1987"
              d="M58.384,235.461h0a.034.034,0,0,0-.024.01h0L50.709,247.13l-.009.015,5.252-4.643.017-.047h0v0l2.452-6.943a.038.038,0,0,0-.038-.049Z"
              transform="translate(-49.48 -229.795)"
              fillRule="evenodd"
              fill="url(#linear-gradient-3)"
            />
            <Path
              id="Path_1988"
              d="M34.521,533.328a.275.275,0,0,0-.026.3h0l1.37,2.852a.166.166,0,0,0,.22.064h0l6.335-3.587-2.3-4.529a.322.322,0,0,1-.013-.245Z"
              transform="translate(-33.635 -515.472)"
              fillRule="evenodd"
              fill="url(#linear-gradient-4)"
            />
            <Path
              id="Path_1989"
              d="M12.484.053V10.93a.31.31,0,0,1-.064.181h0L.073,27.846a.3.3,0,0,0,.039.4h0l8.662,8.361a.148.148,0,0,0,.246-.052h0L18.431,14.53a.356.356,0,0,0,0-.232h0L12.6.028a.055.055,0,0,0-.053-.038h0a.064.064,0,0,0-.064.063Z"
              transform="translate(-0.013 0.01)"
              fillRule="evenodd"
              fill="url(#linear-gradient-5)"
            />
            <Path
              id="Path_1990"
              d="M517.737,0h0a.063.063,0,0,0-.064.063l0,10.877a.306.306,0,0,1-.016.09l5.886,3.1L517.789.038A.056.056,0,0,0,517.737,0Zm-.077,11.03,1.124.645Z"
              transform="translate(-505.206 0)"
              fillRule="evenodd"
              fill="url(#linear-gradient-6)"
            />
            <Path
              id="Path_1991"
              d="M523.654,461.858v0a.359.359,0,0,0-.018-.113h0l-.075-.184-5.891-3.1,1.128.645Z"
              transform="translate(-505.215 -447.429)"
              fillRule="evenodd"
              fill="url(#linear-gradient-7)"
            />
            <Path
              id="Path_1992"
              d="M37.355,532.816l-.325.5,5.581-5.142Z"
              transform="translate(-36.139 -515.462)"
              fill="#be80f5"
            />
          </G>
        </G>
      </G>
    </Svg>
  )
}

export default AmbireLogoHorizontal
