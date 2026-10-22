import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  modal: ViewStyle
  content: ViewStyle
  closeButton: ViewStyle
  closeIconWrapper: ViewStyle
  title: TextStyle
  description: TextStyle
  updateButton: ViewStyle
}

// The design measures its distances from the outer edge of the card, but the card has a border
// (see `BottomSheet`) and children are laid out inside of it
const MODAL_BORDER_WIDTH = 1
const CLOSE_BUTTON_SIZE = 32
const CLOSE_BUTTON_OFFSET = 4
const CLOSE_ICON_WRAPPER_SIZE = 24
const CONTENT_PADDING_TOP = 52
const CONTENT_PADDING_BOTTOM = 40

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    modal: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.primaryAccent100,
      borderColor: theme.primaryAccent300,
      borderRadius: BORDER_RADIUS_PRIMARY,
      // The padding lives in `content`, so that the close button is positioned from the card's edge
      ...spacings.ph0,
      ...spacings.pv0
    },
    content: {
      ...spacings.ph,
      paddingTop: CONTENT_PADDING_TOP - MODAL_BORDER_WIDTH,
      paddingBottom: CONTENT_PADDING_BOTTOM - MODAL_BORDER_WIDTH
    },
    closeButton: {
      position: 'absolute',
      top: CLOSE_BUTTON_OFFSET - MODAL_BORDER_WIDTH,
      right: CLOSE_BUTTON_OFFSET - MODAL_BORDER_WIDTH,
      width: CLOSE_BUTTON_SIZE,
      height: CLOSE_BUTTON_SIZE,
      zIndex: 1,
      ...flexbox.center
    },
    closeIconWrapper: {
      width: CLOSE_ICON_WRAPPER_SIZE,
      height: CLOSE_ICON_WRAPPER_SIZE,
      borderRadius: CLOSE_ICON_WRAPPER_SIZE / 2,
      backgroundColor: theme.primaryBackground,
      ...flexbox.center
    },
    // `Text` resets the line height whenever it gets a custom font size
    title: {
      lineHeight: 28
    },
    description: {
      lineHeight: 18
    },
    updateButton: {
      width: 192,
      alignSelf: 'center'
    }
  })

export default getStyles
