import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import colors from '@common/styles/colors'
import {
  DEVICE_HEIGHT,
  SPACING,
  SPACING_LG,
  SPACING_MD,
  SPACING_SM,
  SPACING_TY
} from '@common/styles/spacings'

interface Styles {
  root: ViewStyle
  bottomSheet: ViewStyle
  containerInnerWrapper: ViewStyle
  closeBtn: ViewStyle
  cancelBtn: ViewStyle
  dragger: ViewStyle
  backDrop: ViewStyle
}

const styles = StyleSheet.create<Styles>({
  root: {
    // Lower number that the toasts' zIndex
    zIndex: 900,
    elevation: 19
  },
  bottomSheet: {
    backgroundColor: colors.clay,
    borderTopStartRadius: 15,
    borderTopEndRadius: 15,
    paddingTop: 23
  },
  containerInnerWrapper: {
    paddingBottom: SPACING_MD,
    paddingHorizontal: isWeb ? SPACING_LG : SPACING
  },
  closeBtn: {
    position: 'absolute',
    right: isWeb ? SPACING_TY : SPACING,
    zIndex: 2
  },
  cancelBtn: {
    alignSelf: 'center',
    marginTop: SPACING_SM
  },
  dragger: {
    width: 50,
    height: 3,
    borderRadius: 4,
    backgroundColor: colors.titan,
    top: 10
  },
  backDrop: {
    width: '100%',
    height: '100%',
    minHeight: DEVICE_HEIGHT,
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 1
  }
})

export default styles
