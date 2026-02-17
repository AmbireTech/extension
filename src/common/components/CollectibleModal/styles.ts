import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { getUiType } from '@web/utils/uiType'

interface Style {
  modal: ViewStyle
  imageContainer: ViewStyle
  image: ImageStyle
}

const { isTab } = getUiType()

export const COLLECTIBLE_IMAGE_SIZE = 300

const getStyles = () =>
  StyleSheet.create<Style>({
    modal: {
      ...spacings.phSm,
      ...spacings.pvSm,
      maxWidth: COLLECTIBLE_IMAGE_SIZE + SPACING_SM * 2
    },
    imageContainer: {
      ...spacings.mbSm
    },
    image: {
      borderRadius: BORDER_RADIUS_PRIMARY,
      backgroundColor: 'transparent'
    }
  })

export default getStyles
