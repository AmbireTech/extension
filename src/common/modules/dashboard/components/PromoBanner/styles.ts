import { StyleSheet, ViewStyle } from 'react-native'

import { SPACING } from '@common/styles/spacings'

interface Style {
  button: ViewStyle
}

export const BANNER_WIDTH = 43
export const BANNER_HEIGHT = 48

const styles = StyleSheet.create<Style>({
  button: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 95,
    right: -1 * SPACING,
    zIndex: 10
  }
})

export default styles
