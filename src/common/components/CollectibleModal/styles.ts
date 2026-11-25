import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_LG, SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  card: ViewStyle
  imageContainer: ViewStyle
  image: ImageStyle
  details: ViewStyle
  actions: ViewStyle
  secondaryActions: ViewStyle
}

export const COLLECTIBLE_IMAGE_SIZE = 300

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    card: {
      maxWidth: COLLECTIBLE_IMAGE_SIZE + SPACING_LG * 2
    },
    // A square as wide as the sheet
    imageContainer: {
      ...spacings.mbSm,
      width: '100%',
      aspectRatio: 1,
      borderRadius: BORDER_RADIUS_PRIMARY,
      overflow: 'hidden'
    },
    image: {
      borderRadius: BORDER_RADIUS_PRIMARY,
      backgroundColor: 'transparent'
    },
    details: {
      ...spacings.phSm,
      ...spacings.pvSm,
      width: '100%',
      borderRadius: BORDER_RADIUS_PRIMARY,
      backgroundColor: theme.secondaryBackground
    },
    // The sheet's footer spaces them from the content
    actions: {
      width: '100%',
      rowGap: SPACING_SM
    },
    secondaryActions: {
      ...flexbox.directionRow,
      columnGap: SPACING_SM
    }
  })

export default getStyles
