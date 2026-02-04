import { ImageStyle, Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING, SPACING_LG } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import commonWebStyles from '@web/styles/utils/common'
import { getUiType } from '@web/utils/uiType'

const { isTab } = getUiType()

export const HEADER_HEIGHT = Platform.select({
  web: isTab ? 50 + SPACING_LG * 2 : 40 + SPACING * 2,
  default: 60
})

interface Styles {
  container: ViewStyle
  widthContainer: ViewStyle
  containerInner: ViewStyle
  imageAndTitleContainer: ViewStyle
  navIconContainerRegular: ViewStyle
  title: TextStyle
  image: ImageStyle
  sideContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    container: {
      zIndex: 9,
      width: '100%',
      backgroundColor: theme.secondaryBackground,
      ...spacings.pv,
      height: HEADER_HEIGHT
    },
    widthContainer: {
      width: '100%',
      marginHorizontal: 'auto',
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.flex1
    },
    containerInner: {
      flexDirection: 'row',
      alignItems: 'center',
      ...commonWebStyles.contentContainer,
      flex: 1
    },
    imageAndTitleContainer: {
      justifyContent: 'center',
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center'
    },
    navIconContainerRegular: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: {
      textAlign: 'center',
      flex: 1,
      ...spacings.phTy
    },
    image: {
      ...common.borderRadiusPrimary,
      width: 40,
      height: 40,
      ...spacings.mrSm
    },
    sideContainer: {
      width: 120,
      minWidth: 120
    }
  })

export default getStyles
