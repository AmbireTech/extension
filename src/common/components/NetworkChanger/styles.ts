import { StyleSheet, ViewProps } from 'react-native'

import colors from '@common/styles/colors'
import spacings, { SPACING_MD } from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'

interface Styles {
  networksContainer: ViewProps
  networkBtnContainer: ViewProps
  networkBtnContainerActive: ViewProps
  networkBtnContainerActiveWeb: ViewProps
  networkBtnIcon: ViewProps
}

const ICON_WRAPPER_SIZE = 40
export const SINGLE_ITEM_HEIGHT = 50

const styles = StyleSheet.create<Styles>({
  networksContainer: {
    height: SINGLE_ITEM_HEIGHT * 5,
    ...spacings.mbMd
  },
  networkBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING_MD,
    ...spacings.prMd,
    height: SINGLE_ITEM_HEIGHT,
    ...spacings.pvTy
  },
  networkBtnContainerActive: {
    borderRadius: 13,
    backgroundColor: colors.howl,
    position: 'absolute',
    width: '100%',
    top: SINGLE_ITEM_HEIGHT * 2,
    left: 0,
    height: SINGLE_ITEM_HEIGHT,
    borderWidth: 1,
    borderColor: colors.turquoise
  },
  networkBtnContainerActiveWeb: {
    backgroundColor: colors.howl,
    ...commonStyles.borderRadiusPrimary
  },
  networkBtnIcon: {
    width: ICON_WRAPPER_SIZE,
    height: ICON_WRAPPER_SIZE,
    backgroundColor: colors.valhalla,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...spacings.mrMd
  }
})

export default styles
