import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import { SPACING, SPACING_LG, SPACING_MD, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  content: ViewStyle
  hero: ViewStyle
  description: TextStyle
  notice: ViewStyle
  benefits: ViewStyle
  benefit: ViewStyle
  tokensGrid: ViewStyle
  tokenCard: ViewStyle
  tokenMeta: ViewStyle
  networkGrid: ViewStyle
  networkCard: ViewStyle
  networkIconWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    content: {
      width: '100%',
      maxWidth: 1180,
      marginHorizontal: 'auto',
      paddingBottom: 64
    },
    hero: {
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      paddingTop: SPACING_MD,
      paddingBottom: SPACING_LG
    },
    description: {
      maxWidth: 820,
      textAlign: 'center',
      lineHeight: 24
    },
    notice: {
      borderWidth: 1,
      borderColor: theme.warningDecorative,
      backgroundColor: theme.warningBackground,
      borderRadius: 8,
      padding: SPACING,
      marginTop: SPACING_MD
    },
    benefits: {
      ...flexbox.directionRow,
      flexWrap: 'wrap',
      marginHorizontal: -SPACING_TY
    },
    benefit: {
      flexGrow: 1,
      flexBasis: 260,
      minWidth: 260,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 8,
      padding: SPACING,
      margin: SPACING_TY
    },
    tokensGrid: {
      ...flexbox.directionRow,
      flexWrap: 'wrap',
      marginHorizontal: -SPACING_TY
    },
    tokenCard: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      flexBasis: 190,
      minWidth: 190,
      flexGrow: 1,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 8,
      padding: SPACING_SM,
      margin: SPACING_TY
    },
    tokenMeta: {
      ...flexbox.flex1,
      marginLeft: SPACING_SM
    },
    networkGrid: {
      ...flexbox.directionRow,
      flexWrap: 'wrap',
      marginHorizontal: -SPACING_TY
    },
    networkCard: {
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      flexGrow: 1,
      flexBasis: 260,
      minWidth: 260,
      minHeight: 150,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 8,
      padding: SPACING_LG,
      margin: SPACING_TY
    },
    networkIconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.primaryBackground,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      marginBottom: SPACING_SM
    }
  })

export default getStyles
