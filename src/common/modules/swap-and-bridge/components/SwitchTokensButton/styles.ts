import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  switchTokensButtonWrapper: ViewStyle
  switchTokensButton: ViewStyle
}

/** The ring around the switch tokens button. It straddles the seam between the You send and You
 * receive panels, and its right edge is the line the columns inside both of them line up on. */
export const SWITCH_TOKENS_BUTTON_SIZE = 34
/** How far past the panels' shared middle the button reaches. */
export const SWITCH_TOKENS_BUTTON_OVERHANG = SWITCH_TOKENS_BUTTON_SIZE / 2

const WRAPPER_SIZE = SWITCH_TOKENS_BUTTON_SIZE
const BUTTON_SIZE = 28

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    switchTokensButtonWrapper: {
      position: 'absolute',
      top: -23,
      left: '50%',
      // On the web `left` wins over alignSelf and puts the wrapper's own left edge on the seam
      // between the two panels, so it has to come back by half of itself to sit on it. Native
      // centers it from alignSelf alone and needs no correction
      transform: [{ translateX: isMobile ? 0 : -WRAPPER_SIZE / 2 }],
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...flexbox.alignSelfCenter,
      zIndex: 10,
      width: WRAPPER_SIZE,
      height: WRAPPER_SIZE,
      borderRadius: 50,
      backgroundColor: theme.primaryBackground
    },
    switchTokensButton: {
      borderRadius: 50,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      backgroundColor: hexToRgba(theme.primaryAccent200, 0.12)
    }
  })

export default getStyles
