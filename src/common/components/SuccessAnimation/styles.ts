import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'

interface Style {
  boxWrapper: ViewStyle
  backgroundShapes: ViewStyle
  animationContainer: ViewStyle
  lottieView: ViewStyle
  checkIcon: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    boxWrapper: {
      ...spacings.pvMd,
      ...spacings.phMd,
      backgroundColor: theme.primaryBackground
    },
    backgroundShapes: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '90%',
      height: '70%',
      zIndex: -1,
      ...spacings.mhSm
    },
    animationContainer: { position: 'relative', width: 388, height: 217, alignSelf: 'center' },
    lottieView: {
      width: 388,
      height: 217,
      // @ts-ignore
      pointerEvents: 'none'
    },
    checkIcon: { position: 'absolute', top: '50%', left: '50%' }
  })

export default getStyles
