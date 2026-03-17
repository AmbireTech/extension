import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { getUiType } from '@common/utils/uiType'

interface Style {
  container: ViewStyle
  image: ImageStyle
}

const isTab = getUiType().isTab

export const COLLECTIBLE_SIZE = isTab ? 96 : 64

const styles = StyleSheet.create<Style>({
  container: {
    position: 'relative',
    borderRadius: BORDER_RADIUS_PRIMARY,
    overflow: 'hidden'
  },
  image: {
    borderRadius: BORDER_RADIUS_PRIMARY,
    backgroundColor: 'transparent'
  }
})

export default styles
