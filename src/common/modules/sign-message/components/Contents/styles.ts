import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

// Styles owned by the shared sign-message Content components. Previously these
// borrowed the web SignMessageScreen's styles (an env-separation violation, and
// the mobile screen styles lacked the erc7730* keys). Keeping them here, in
// common, lets both web and mobile render the same content consistently.
interface Style {
  container: ViewStyle
  kindOfMessage: ViewStyle
  warningContainer: ViewStyle
  erc7730TypedMessageTitleRow: ViewStyle
  erc7730TypedMessageTitle: TextStyle
  erc7730TypedMessageTabHeader: ViewStyle
  erc7730TypedMessageTabButton: ViewStyle
  erc7730TypedMessageRawContainer: ViewStyle
  erc7730TypedMessageRawActions: ViewStyle
  erc7730TypedMessageRawText: TextStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.flex1
    },
    kindOfMessage: {
      backgroundColor: theme.infoBackground,
      borderColor: theme.infoDecorative,
      borderWidth: 1,
      borderRadius: 24,
      width: 'auto',
      height: 24,
      ...flexbox.justifyCenter,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.ph
    },
    warningContainer: {
      borderWidth: 1,
      backgroundColor: theme.warningBackground,
      borderColor: theme.warningDecorative
    },
    erc7730TypedMessageTitleRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      minWidth: 0,
      ...spacings.pbMi
    },
    erc7730TypedMessageTitle: {
      flexShrink: 1,
      ...spacings.mrSm
    },
    erc7730TypedMessageTabHeader: {
      ...flexbox.directionRow,
      alignSelf: 'stretch',
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryBorder,
      marginBottom: SPACING_SM
    },
    erc7730TypedMessageTabButton: {
      paddingVertical: SPACING_TY,
      marginRight: SPACING_TY,
      borderBottomWidth: 2
    },
    erc7730TypedMessageRawContainer: {
      position: 'relative',
      ...spacings.mtTy
    },
    erc7730TypedMessageRawActions: {
      position: 'absolute',
      top: 0,
      right: 0,
      zIndex: 1
    },
    erc7730TypedMessageRawText: {
      ...spacings.prXl
    }
  })

export default getStyles
