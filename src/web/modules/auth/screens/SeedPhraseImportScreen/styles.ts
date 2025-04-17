import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_MI } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

type Styles = {
  errorText: ViewStyle
  passphraseContainer: ViewStyle
  overlay: ViewStyle
  textAreaWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    errorText: {
      ...spacings.phMi,
      ...spacings.mbMI,
      ...spacings.phTy,
      paddingTop: SPACING_MI / 2
    },
    passphraseContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.secondaryBorder,
      ...spacings.ptLg,
      ...flexbox.directionRow,
      ...flexbox.alignStart
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
      ...flexbox.directionRow,
      ...flexbox.wrap,
      height: 22,
      padding: 19
    },
    textAreaWrapper: { position: 'relative' }
  })

export default getStyles
