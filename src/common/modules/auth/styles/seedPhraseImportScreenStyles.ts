import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_MI } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Styles = {
  errorText: ViewStyle
  passphraseContainer: ViewStyle
  overlay: ViewStyle
  textAreaWrapper: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    errorText: {
      ...spacings.phMi,
      ...spacings.mbMI,
      ...spacings.phTy,
      paddingTop: SPACING_MI / 2
    },
    passphraseContainer: {
      ...spacings.pt,
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
      height: 21,
      padding: 14.5
    },
    textAreaWrapper: { position: 'relative', ...spacings.mbSm }
  })

export default getStyles
