import { StyleSheet } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create({
    outerContainer: {
      borderWidth: 2,
      borderRadius: BORDER_RADIUS_PRIMARY,
      borderColor: theme.secondaryBackground,
      overflow: 'hidden'
    },
    outerContainerWarning: {
      borderColor: theme.errorBackground
    },
    containerWarning: {
      borderWidth: 1,
      borderColor: theme.errorDecorative
    }
  })
export default getStyles
