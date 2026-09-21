import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'

interface Style {
  inputContainer: ViewStyle
}

const styles = StyleSheet.create<Style>({
  inputContainer: { ...spacings.mbMi }
})

export default styles
