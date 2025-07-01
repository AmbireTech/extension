import React from 'react'
import { View } from 'react-native'
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

type Props = {
  width?: number
  height?: number
  withWrapper?: boolean
}

const AmbireLogo: React.FC<any> = ({ width = 74, height = 112, withWrapper }: Props) => {
  const { styles } = useTheme(getStyles)
  return (
    <View style={withWrapper ? styles.wrapper : {}}>
      <Svg
        width={withWrapper ? width - 4 : width}
        height={withWrapper ? height - 4 : height}
        viewBox="0 0 68 112.371"
      >
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
            y1="0.061"
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
            x2="0.986"
            y2="0.95"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0" stopColor="#ae60ff" />
            <Stop offset="0.031" stopColor="#b670fa" />
            <Stop offset="1" stopColor="#be80f5" />
          </LinearGradient>
        </Defs>
        <G transform="translate(-36.039 0.01)">
          <G transform="translate(36.039 -0.01)">
            <G>
              <Path
                d="M745.731,420.545l14.746,31.389a.891.891,0,0,1-.181.979l-38.789,37.479a.43.43,0,0,1-.726-.326V455.632l24.444-23.6a.8.8,0,0,0,.255-.616l.073-10.874c0-.073.145-.073.181,0Z"
                transform="translate(-685.744 -378.139)"
                fill="#6000ff"
              />
              <Path
                d="M720.761,557.664V592.1a.43.43,0,0,0,.726.326h0l38.79-37.479a.89.89,0,0,0,.182-.979h0L745.315,533.95,720.76,557.664Z"
                transform="translate(-685.726 -480.172)"
                fillRule="evenodd"
                fill="url(#linear-gradient)"
              />
              <Path
                d="M964.867,420.11h-.006a.083.083,0,0,0-.088.087h0l-.062,10.872a.9.9,0,0,1-.142.506l15.2,20.519a.952.952,0,0,0-.073-.544h0L964.956,420.16a.1.1,0,0,0-.089-.05Z"
                transform="translate(-904.981 -377.797)"
                fillRule="evenodd"
                fill="url(#linear-gradient-2)"
              />
              <Path
                d="M985.5,562.194a.95.95,0,0,0-.073-.544h0l-.763-1.631L970.94,542.54Z"
                transform="translate(-910.709 -487.897)"
                fill="#be80f5"
                fillRule="evenodd"
              />
              <Path
                d="M418.818,158.158,411.881,177.8a.91.91,0,0,0,.036.689l6.465,12.722-17.8,10.077a.466.466,0,0,1-.617-.181l-3.85-8.011a.769.769,0,0,1,.073-.833l22.446-34.217a.11.11,0,0,1,.181.109Z"
                transform="translate(-393.699 -142.104)"
                fill="#6000ff"
              />
              <Path
                d="M428.526,158.03h-.007a.1.1,0,0,0-.068.029h0l-21.487,32.755-.024.043L421.7,177.814l.046-.132h0l0-.009,6.887-19.5a.107.107,0,0,0-.106-.138Z"
                transform="translate(-403.513 -142.113)"
                fillRule="evenodd"
                fill="url(#linear-gradient-3)"
              />
              <Path
                d="M396.2,368.913a.773.773,0,0,0-.073.834h0l3.849,8.011a.466.466,0,0,0,.618.18h0l17.8-10.077-6.465-12.722a.91.91,0,0,1-.036-.689Z"
                transform="translate(-393.712 -318.75)"
                fillRule="evenodd"
                fill="url(#linear-gradient-4)"
              />
              <Path
                d="M407.947.177V30.733a.866.866,0,0,1-.181.508h0L373.079,78.253a.839.839,0,0,0,.109,1.124h0l24.335,23.488a.416.416,0,0,0,.69-.145h0l26.441-61.873a1,1,0,0,0,0-.653h0L408.273.106A.156.156,0,0,0,408.125,0h0a.179.179,0,0,0-.179.177Z"
                transform="translate(-372.912 0.001)"
                fillRule="evenodd"
                fill="url(#linear-gradient-5)"
              />
              <Path
                d="M720.536-.009h0a.178.178,0,0,0-.179.177l.011,30.556a.863.863,0,0,1-.045.254l16.536,8.706L720.68.1a.157.157,0,0,0-.145-.106Zm-.216,30.987,3.158,1.812Z"
                transform="translate(-685.33 0.01)"
                fillRule="evenodd"
                fill="url(#linear-gradient-6)"
              />
              <Path
                d="M737.129,317.216v-.005a1,1,0,0,0-.051-.317h0l-.21-.518L720.32,307.67l3.17,1.812,13.641,7.734Z"
                transform="translate(-685.331 -276.682)"
                fillRule="evenodd"
                fill="url(#linear-gradient-7)"
              />
              <Path
                d="M398.684,367.512l-.913,1.393,15.678-14.445Z"
                transform="translate(-395.266 -318.759)"
                fill="#be80f5"
              />
            </G>
          </G>
        </G>
      </Svg>
    </View>
  )
}

export default React.memo(AmbireLogo)
