import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

interface Style {
  container: ViewStyle
  nonTabButtons: ViewStyle
  headerSideContainer: ViewStyle
}

const { isRequestWindow, isTab } = getUiType()

// Make the form slightly larger in request window
// so it stretches as much as the header
export const TRANSACTION_FORM_WIDTH = isRequestWindow ? 656 : 600

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      width: '100%',
      maxWidth: TRANSACTION_FORM_WIDTH,
      flex: 1
      // alignSelf: 'center',
      // overflow: 'visible'
      // alignItems: 'stretch'
    },
    nonTabButtons: {
      ...flexbox.flex1,
      ...spacings.pb,
      ...flexbox.justifyEnd
    },
    headerSideContainer: { width: isTab ? 300 : 170, minWidth: isTab ? 300 : 160 }
  })

export default getStyles
