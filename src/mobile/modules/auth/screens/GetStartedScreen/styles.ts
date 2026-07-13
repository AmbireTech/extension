import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  separatorHorizontal: ViewStyle
  showMoreOptionsButtonContainer: ViewStyle
  showMoreOptionsButton: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    separatorHorizontal: {
      position: 'absolute',
      width: '100%',
      height: 1,
      backgroundColor: theme.secondaryBorder
    },
    showMoreOptionsButtonContainer: {
      backgroundColor: theme.secondaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
      ...spacings.pbTy,
      ...spacings.ptSm,
      ...spacings.mbMd,
      width: '100%'
    },
    showMoreOptionsButton: {
      backgroundColor: theme.secondaryBackground,
      ...spacings.ph,
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    }
  })

export default getStyles
