import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  infoBadge: ViewStyle
  info2Badge: ViewStyle
  defaultBadge: ViewStyle
  successBadge: ViewStyle
  warningBadge: ViewStyle
  errorBadge: ViewStyle
  newBadge: ViewStyle
  projectedRewards: ViewStyle
}

const label: ViewStyle = {
  ...flexbox.alignCenter,
  ...flexbox.justifyCenter,
  ...spacings.phTy,
  borderWidth: 1,
  borderRadius: 50
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.directionRow,
      ...common.borderRadiusTertiary
    },
    infoBadge: {
      ...label,
      borderColor: theme.infoDecorative,
      backgroundColor: theme.infoBackground
    },
    info2Badge: {
      ...label,
      borderColor: theme.info2Decorative,
      backgroundColor: theme.info2Background
    },
    defaultBadge: {
      ...label,
      borderColor: theme.secondaryBorder,
      backgroundColor: 'transparent'
    },
    warningBadge: {
      ...label,
      borderColor: theme.warningDecorative,
      backgroundColor: theme.warningBackground
    },
    successBadge: {
      ...label,
      borderColor: theme.successDecorative,
      backgroundColor: theme.successBackground
    },
    errorBadge: {
      ...label,
      borderColor: theme.errorDecorative,
      backgroundColor: theme.errorBackground
    },
    newBadge: {
      ...label,
      borderColor: theme.infoDecorative,
      // @ts-ignore
      backgroundImage: 'linear-gradient(90deg, #6000FF 0%, #FFA000 100%)'
    },
    projectedRewards: {
      ...label,
      borderColor: '#D7FF0010',
      backgroundColor: '#D7FF0010'
    }
  })

export default getStyles
