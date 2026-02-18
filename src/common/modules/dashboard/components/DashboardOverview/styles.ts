import { StyleSheet, ViewStyle } from 'react-native'

import commonWebStyles from '@web/styles/utils/common'

interface Style {
  contentContainer: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    contentContainer: commonWebStyles.contentContainer
  })

export default getStyles
