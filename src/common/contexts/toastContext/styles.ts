import { StyleSheet, ViewStyle } from 'react-native'

import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
  toastWrapper: ViewStyle
  toast: ViewStyle
  error: ViewStyle
  badge: ViewStyle
  errorBadge: ViewStyle
}

const styles = StyleSheet.create<Style>({
  container: {
    position: 'absolute',
    width: '100%',
    zIndex: 999,
    elevation: 20,
    ...spacings.ph
  },
  toastWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
    ...spacings.mbTy
  },
  toast: {
    backgroundColor: colors.onahau,
    borderLeftColor: colors.turquoise,
    borderLeftWidth: 8,
    alignItems: 'center',
    flexDirection: 'row',
    ...spacings.pvTy,
    ...spacings.phTy,
    height: 'auto',
    minHeight: 20,
    opacity: 0.96,
    width: '100%',
    flex: 1,
    ...common.shadowPrimary
  },
  error: {
    backgroundColor: colors.pigPink,
    borderLeftColor: colors.pink
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 50,
    backgroundColor: colors.turquoise,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorBadge: {
    backgroundColor: colors.pink
  }
})

export default styles
