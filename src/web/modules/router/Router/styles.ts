import { StyleSheet, ViewStyle } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'
import { isOpera, isSafari } from '@web/constants/browserapi'
import { POPUP_WIDTH } from '@web/constants/spacings'
import { getUiType } from '@web/utils/uiType'

interface Style {
  container: ViewStyle
}

const { isPopup, isRequestWindow } = getUiType()

const getStyles = () =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.flex1,
      ...(isPopup ? { maxWidth: POPUP_WIDTH } : {}),
      ...(isPopup && isSafari() ? { maxHeight: POPUP_WIDTH } : {}),
      // to prevent content to be overlapped by the request-window's top bar on Opera
      ...(isOpera() && isRequestWindow ? { paddingTop: 15 } : {})
    }
  })

export default getStyles
