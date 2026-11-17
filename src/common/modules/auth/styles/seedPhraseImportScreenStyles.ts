import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_MI } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Styles = {
  errorText: ViewStyle
  passphraseContainer: ViewStyle
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
    textAreaWrapper: { position: 'relative', ...spacings.mbSm }
  })

export default getStyles
