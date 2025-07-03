import LottieView from 'lottie-react'
import React from 'react'
import { View } from 'react-native'

import CheckIcon2 from '@common/assets/svg/CheckIcon2'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

import animation from './animation.json'
import BackgroundShapes from './BackgroundShapes'
import getStyles from './styles'

const SuccessAnimation = ({
  width = 421,
  height = 343,
  noBackgroundShapes = false,
  animationContainerStyle,
  style,
  children
}: {
  width?: number
  height?: number
  noBorder?: boolean
  noBackgroundShapes?: boolean
  animationContainerStyle?: object
  style?: object

  children?: React.ReactNode | React.ReactNode[]
}) => {
  const { styles, themeType, theme } = useTheme(getStyles)
  return (
    <View
      style={[
        {
          width,
          height,
          ...style
        }
      ]}
    >
      {!noBackgroundShapes && <BackgroundShapes style={styles.backgroundShapes} />}
      <View style={[styles.animationContainer, animationContainerStyle]}>
        <LottieView
          animationData={animation}
          style={{ ...styles.lottieView, ...animationContainerStyle, opacity: 0.12 }}
          loop
        />
        <CheckIcon2
          style={[
            styles.checkIcon,
            {
              transform: [{ translateX: -0.5 * 64 }, { translateY: -0.5 * 64 }]
            }
          ]}
        />
      </View>
      <View style={[flexbox.alignCenter, flexbox.justifyCenter]}>{children}</View>
    </View>
  )
}
export default React.memo(SuccessAnimation)
