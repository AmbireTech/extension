import { StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
  listItem: ViewStyle
  expandedContainer: ViewStyle
  openIconWrapper: ViewStyle
  action: ViewStyle
  unknown: ViewStyle
  cancel: ViewStyle
}

const styles = StyleSheet.create<Style>({
  container: {
    backgroundColor: colors.howl,
    ...commonStyles.borderRadiusPrimary
  },
  action: {
    color: colors.greenHaze
  },
  unknown: {
    color: colors.mustard
  },
  cancel: {
    color: colors.pink
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.howl,
    ...commonStyles.borderRadiusPrimary,
    ...spacings.phTy,
    ...spacings.pvTy
  },
  expandedContainer: {
    opacity: 0.5,
    ...spacings.phTy,
    ...spacings.pbTy,
    backgroundColor: 'transparent'
  },
  openIconWrapper: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 4
  }
})

export default styles
