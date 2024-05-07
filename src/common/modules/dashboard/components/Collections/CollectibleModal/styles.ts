import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_SM } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import { getUiType } from '@web/utils/uiType'

interface Style {
  modal: ViewStyle
  imageContainer: ViewStyle
  image: ImageStyle
}

const { isTab } = getUiType()

export const COLLECTIBLE_IMAGE_SIZE = isTab ? 400 : 300

const getStyles = () =>
  StyleSheet.create<Style>({
    modal: {
      ...spacings.phSm,
      ...spacings.pvSm,
      maxWidth: COLLECTIBLE_IMAGE_SIZE + SPACING_SM * 2
    },
    imageContainer: {
      ...spacings.mbSm,
      backgroundColor: 'transparent'
    },
    image: {
      ...common.borderRadiusPrimary
    }
  })

export default getStyles
