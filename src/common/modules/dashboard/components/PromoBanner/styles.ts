import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isAndroid } from '@common/config/env'

interface Style {
  button: ViewStyle
  emoji: TextStyle
  emojiTitle: TextStyle
  bannerIcon: ViewStyle
  content: ViewStyle
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
    right: 0,
    zIndex: 10
  },
  emoji: {
    textAlign: 'center',
    width: 36,
    lineHeight: 38
  },
  emojiTitle: {
    lineHeight: isAndroid ? 70 : 60
  },
  bannerIcon: {
    position: 'absolute'
  },
  content: {
    marginBottom: 100
  }
})

export default styles
