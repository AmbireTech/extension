import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'
import flexboxStyles from '@common/styles/utils/flexbox'

interface Style {
  btnContainer: ViewStyle
}

const styles = StyleSheet.create<Style>({
  btnContainer: {
    ...flexboxStyles.center,
    ...spacings.phTy,
    ...spacings.pv,
    ...commonStyles.borderRadiusPrimary,
    borderWidth: 1,
    borderColor: colors.waikawaGray,
    ...(isWeb ? { maxHeight: 68 } : {})
  }
})

export default styles
