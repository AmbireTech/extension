import { StyleSheet, ViewStyle } from 'react-native'

import { SPACING_SM } from '@common/styles/spacings'

interface Style {
  selectContainer: ViewStyle
}

const styles = StyleSheet.create<Style>({
  selectContainer: {
    width: 350, // magic number, so the longest common option is fully visible
    marginBottom: -1 * SPACING_SM, // removes the default select container bottom margin
    marginTop: -1 * SPACING_SM // pushes the select up to align with the label
  }
})

export default styles
