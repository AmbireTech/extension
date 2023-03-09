import { StyleSheet, ViewStyle } from 'react-native'

import { HEADER_HEIGHT } from '@common/modules/header/components/Header/styles'

interface Style {
  backgroundImgWrapper: ViewStyle
}

const styles = StyleSheet.create<Style>({
  backgroundImgWrapper: {
    position: 'absolute',
    zIndex: 0,
    top: -HEADER_HEIGHT,
    paddingLeft: 2,
    alignSelf: 'center'
  }
})

export default styles
