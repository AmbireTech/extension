import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  dropArea: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    dropArea: {
      ...flexbox.flex1,
      ...spacings.pvLg,
      borderRadius: BORDER_RADIUS_PRIMARY,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.neutral600,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.mbXl,
      ...spacings.phLg
    }
  })

export default getStyles
