import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import {
  SPACING,
  SPACING_LG,
  SPACING_MD,
  SPACING_SM,
  SPACING_TY,
  SPACING_XL
} from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  content: ViewStyle
  hero: ViewStyle
  description: TextStyle
  notice: ViewStyle
  benefits: ViewStyle
  benefit: ViewStyle
  tokensHeader: ViewStyle
  filterButton: ViewStyle
  filterBadge: ViewStyle
  filterPanel: ViewStyle
  filterPanelHeader: ViewStyle
  filterNetworkGrid: ViewStyle
  filterNetworkOption: ViewStyle
  filterCheckbox: ViewStyle
  tokensSection: ViewStyle
  tokensGrid: ViewStyle
  tokenCard: ViewStyle
  tokenHeader: ViewStyle
  tokenNetworksTitle: TextStyle
  tokenNetworks: ViewStyle
  tokenNetwork: ViewStyle
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
    tokensHeader: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      marginBottom: SPACING
    },
    filterButton: {
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      width: 40,
      height: 40,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 8
    },
    filterBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      backgroundColor: theme.primaryAccent,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter
    },
    filterPanel: {
      position: 'absolute',
      top: 52,
      right: 0,
      zIndex: 2,
      width: '100%',
      maxWidth: 560,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 8,
      padding: SPACING
    },
    filterPanelHeader: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      marginBottom: SPACING_SM
    },
    filterNetworkGrid: {
      ...flexbox.directionRow,
      flexWrap: 'wrap',
      marginHorizontal: -SPACING_TY
    },
    filterNetworkOption: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      width: '33.333%',
      paddingHorizontal: SPACING_TY,
      marginBottom: SPACING_SM
    },
    filterCheckbox: {
      width: 28,
      marginBottom: 0
    },
    tokensSection: {
      position: 'relative',
      zIndex: 1,
      marginBottom: SPACING_XL
    },
    tokensGrid: {
      ...flexbox.directionRow,
      flexWrap: 'wrap',
      marginHorizontal: -SPACING_TY
    },
    tokenCard: {
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
    tokenHeader: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      alignSelf: 'stretch',
      marginBottom: SPACING
    },
    tokenNetworksTitle: {
      alignSelf: 'stretch',
      textAlign: 'left',
      marginBottom: SPACING_SM
    },
    tokenNetworks: {
      alignSelf: 'stretch'
    },
    tokenNetwork: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      marginBottom: SPACING_TY
    },
    networkGrid: {
      ...flexbox.directionRow,
      flexWrap: 'wrap',
      marginHorizontal: -SPACING_TY
    },
    networkCard: {
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      flexBasis: 260,
      minWidth: 260,
      flexGrow: 1,
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
