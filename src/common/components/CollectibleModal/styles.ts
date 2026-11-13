import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  modal: ViewStyle
  sidePanelSheet: ViewStyle
  sidePanelContent: ViewStyle
  imageContainer: ViewStyle
  image: ImageStyle
  details: ViewStyle
  actions: ViewStyle
  secondaryActions: ViewStyle
}

export const COLLECTIBLE_IMAGE_SIZE = 300

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    modal: {
      ...spacings.phSm,
      ...spacings.pvSm,
      maxWidth: COLLECTIBLE_IMAGE_SIZE + SPACING_SM * 2
    },
    sidePanelSheet: {
      ...spacings.phSm,
      ...spacings.pvSm,
      width: '100%',
      maxWidth: '100%'
    },
    sidePanelContent: {
      width: '100%',
      maxWidth: COLLECTIBLE_IMAGE_SIZE + SPACING_SM * 2,
      alignSelf: 'center'
    },
    // A square as wide as the sheet natively; on web the modal takes its width from it
    imageContainer: {
      ...spacings.mbSm,
      width: isWeb ? COLLECTIBLE_IMAGE_SIZE : '100%',
      maxWidth: '100%',
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
    // In the modal on web; natively the sheet's footer spaces them from the content
    actions: {
      ...(isWeb && spacings.ptSm),
      width: '100%',
      rowGap: SPACING_SM
    },
    secondaryActions: {
      ...flexbox.directionRow,
      columnGap: SPACING_SM
    }
  })

export default getStyles
