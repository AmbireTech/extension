import { ImageStyle, StyleSheet } from 'react-native'

import common from '@common/styles/utils/common'

interface Style {
  dappIcon: ImageStyle
}

const styles = StyleSheet.create<Style>({
  dappIcon: {
    width: 64,
    height: 64,
    ...common.borderRadiusPrimary
  }
})

export default styles
