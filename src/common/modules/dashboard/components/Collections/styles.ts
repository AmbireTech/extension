import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  noCollectibles: TextStyle
  imagesHint: ViewStyle
}

const styles = StyleSheet.create<Style>({
  noCollectibles: { ...flexbox.flex1, textAlign: 'center', ...spacings.mtMd },
  imagesHint: { ...flexbox.justifyEnd, ...spacings.mbTy }
})

export default styles
