import { StyleSheet, ViewProps } from 'react-native'

import colors from '@modules/common/styles/colors'
import spacings, { DEVICE_HEIGHT, DEVICE_WIDTH } from '@modules/common/styles/spacings'
import commonStyles from '@modules/common/styles/utils/common'

interface Style {
  container: ViewProps
  closeBtn: ViewProps
  backDrop: ViewProps
}

const styles = StyleSheet.create<Style>({
  container: {
    ...commonStyles.borderRadiusPrimary,
    backgroundColor: colors.clay,
    ...spacings.pv,
    ...spacings.ph
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 2
  },
  backDrop: {
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 1,
    ...commonStyles.shadowPrimary
  }
})

export default styles
