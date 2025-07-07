import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_2XL } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@web/utils/uiType'

interface Style {
  container: ViewStyle
  panelHeader: ViewStyle
  backgroundWrapper: ViewStyle
  backgroundSVG: ViewStyle
}

const isPopup = getUiType().isPopup

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      marginBottom: isPopup ? 0 : SPACING_2XL,
      borderWidth: isPopup ? 0 : 1,
      borderColor: theme.secondaryBorder,
      borderRadius: isPopup ? 0 : BORDER_RADIUS_PRIMARY,
      overflow: 'hidden',
      backgroundColor: theme.primaryBackground,
      flex: 1
    },
    panelHeader: {
      width: '100%',
      ...spacings.pvLg
    },
    backgroundWrapper: {
      overflow: 'hidden',
      borderBottomLeftRadius: BORDER_RADIUS_PRIMARY,
      borderBottomRightRadius: BORDER_RADIUS_PRIMARY,
      ...flexbox.flex1,
      ...flexbox.alignCenter,
      ...flexbox.justifyEnd
    },
    backgroundSVG: {
      position: 'absolute',
      zIndex: -1
    }
  })

export default getStyles
