import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { SPACING } from '@common/styles/spacings'

interface Style {
  button: ViewStyle
  emoji: TextStyle
  bannerIcon: ViewStyle
}

export const BANNER_WIDTH = 43
export const BANNER_HEIGHT = 48

const styles = StyleSheet.create<Style>({
  button: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'flex-end',
    top: 95,
    right: -1 * SPACING,
    zIndex: 10
  },
  emoji: {
    textAlign: 'center',
    width: 40,
    lineHeight: 38
  },
  bannerIcon: {
    position: 'absolute'
  }
})

export default styles
