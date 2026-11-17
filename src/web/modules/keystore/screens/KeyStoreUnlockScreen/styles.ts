import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

const { isRequestWindow } = getUiType()

interface Style {
  background: ViewStyle
  panel: ViewStyle
  hero: ViewStyle
  container: ViewStyle
  narrowContainer: ViewStyle
  biometricsContainer: ViewStyle
  biometricsIconButton: ViewStyle
  switchButton: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Style>({
    background: isRequestWindow ? { paddingTop: 0 } : {},
    panel: {
      ...spacings.pbLg,
      // The request window is already a small standalone window, so the unlock screen fills
      // it instead of rendering another card inside it.
      ...(isRequestWindow
        ? {
            maxWidth: '100%',
            height: '100%',
            borderRadius: 0,
            shadowOpacity: 0,
            elevation: 0,
            ...spacings.pt
          }
        : spacings.ptSm)
    },
    hero: {
      height: isRequestWindow ? 360 : 324,
      width: '100%',
      ...spacings.phSm
    },
    container: {
      maxWidth: 352,
      width: '100%',
      marginHorizontal: 'auto',
      ...flexbox.alignCenter
    },
    narrowContainer: {
      width: '100%',
      ...flexbox.flex1,
      ...flexbox.alignCenter,
      ...spacings.phSm
    },
    biometricsContainer: {
      width: '100%',
      ...flexbox.alignCenter
    },
    biometricsIconButton: {
      width: 90,
      height: 90,
      borderRadius: 52,
      backgroundColor: '#F3F4F7',
      marginBottom: 50,
      ...flexbox.center
    },
    switchButton: {
      width: '100%'
    }
  })

export default getStyles
