import { StyleSheet } from 'react-native'

import spacings from '@common/styles/spacings'

const styles = StyleSheet.create({
  logoWrapper: {
    flex: 1,
    alignItems: 'center',
    ...spacings.pt,
    paddingBottom: 40
  },
  horizontalLogo: {
    alignSelf: 'center',
    marginBottom: 40
  }
})

export default styles
