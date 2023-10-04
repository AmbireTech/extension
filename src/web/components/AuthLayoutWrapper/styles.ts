import { StyleSheet, ViewStyle } from 'react-native'

interface Style {
  mainContentWrapper: ViewStyle
  sideContentContainer: ViewStyle
  amebaAlpha: ViewStyle
  amebaBeta: ViewStyle
}

const styles = StyleSheet.create<Style>({
  mainContentWrapper: {
    width: 315,
    alignSelf: 'center',
    justifyContent: 'center',
    flex: 1
  },
  sideContentContainer: {
    width: '33%',
    paddingTop: 80,
    paddingHorizontal: 60,
    overflow: 'hidden'
  },
  amebaAlpha: {
    position: 'absolute',
    right: '50%',
    bottom: -910,
    marginRight: -825,
    zIndex: -1
  },
  amebaBeta: {
    position: 'absolute',
    right: '50%',
    bottom: -1050,
    marginRight: -825,
    zIndex: -1
  }
})

export default styles
