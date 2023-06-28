import { StyleSheet, ViewProps } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  accountContainer: ViewProps
  accountContainerActive: ViewProps
  activeBlockieStyle: ViewProps
}

const styles = StyleSheet.create<Styles>({
  accountContainer: {
    ...flexbox.directionRow,
    ...spacings.mbTy,
    ...spacings.phSm,
    ...spacings.pvTy,
    backgroundColor: colors.howl,
    borderRadius: 13
  },
  accountContainerActive: {
    borderWidth: 1,
    borderColor: colors.turquoise
  },
  activeBlockieStyle: {
    borderWidth: 3,
    borderRadius: 50,
    borderColor: colors.lightViolet
  }
})

export default styles
