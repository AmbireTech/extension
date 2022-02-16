import { StyleSheet, TextProps, ViewProps } from 'react-native'

interface Styles {
  chevron: TextProps
  networkIcon: TextProps
  accItemStyle: ViewProps
  inactiveAccount: ViewProps
  actionsContainer: ViewProps
  actionsContainerItem: ViewProps
}

const styles = StyleSheet.create<Styles>({
  accItemStyle: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  chevron: {
    fontSize: 12
  },
  inactiveAccount: {
    opacity: 0.5
  },
  networkIcon: {
    // so it aligns better vertically within text
    marginTop: -3
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actionsContainerItem: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: '33%' // a bit dirty, but for some reason `flexBasis` didn't click
  }
})

export default styles
