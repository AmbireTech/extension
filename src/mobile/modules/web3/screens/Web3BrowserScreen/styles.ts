import { StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings, { SPACING_TY } from '@common/styles/spacings'

interface Style {
  container: ViewStyle
  webview: ViewStyle
  loadingWrapper: ViewStyle
  webviewButtonCommon: ViewStyle
  reload: ViewStyle
  addressInputStyle: ViewStyle
  addressInputWrapperStyle: ViewStyle
}

const styles = StyleSheet.create<Style>({
  container: {
    backgroundColor: 'transparent'
  },
  webview: {
    flex: 1,
    backgroundColor: colors.white
  },
  loadingWrapper: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  webviewButtonCommon: {
    borderRadius: 22,
    padding: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reload: {
    marginRight: SPACING_TY,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addressInputStyle: {
    height: 'auto',
    fontSize: 16,
    color: colors.white
  },
  addressInputWrapperStyle: {
    height: 'auto',
    paddingVertical: 7,
    backgroundColor: colors.baileyBells,
    borderBottomColor: colors.white
  }
})

export default styles
