import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  header: ViewStyle
  headerText: TextStyle
  tabHeader: ViewStyle
  tabButton: ViewStyle
  parsedRow: ViewStyle
  parsedLabel: TextStyle
  parsedValue: ViewStyle
  parsedValueText: TextStyle
  rawText: TextStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    container: {
      ...common.borderRadiusPrimary,
      backgroundColor: theme.secondaryBackground,
      ...flexbox.flex1,
      minHeight: 200,
      ...spacings.pvSm,
      ...(isMobile ? spacings.phSm : spacings.ph)
    },
    header: {
      ...spacings.mb,
      flexDirection: 'row',
      alignItems: 'center'
    },
    headerText: { ...spacings.mlMi },
    tabHeader: {
      ...flexbox.directionRow,
      alignSelf: 'stretch',
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryBorder,
      marginBottom: SPACING_SM
    },
    tabButton: {
      paddingVertical: SPACING_TY,
      marginRight: SPACING_TY,
      borderBottomWidth: 2
    },
    parsedRow: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignStart,
      width: '100%',
      paddingVertical: SPACING_TY,
      flexWrap: 'wrap'
    },
    parsedLabel: {
      flex: 1,
      minWidth: isMobile ? 96 : 140
    },
    parsedValue: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyEnd,
      flexWrap: 'wrap',
      flex: 1.7,
      minWidth: isMobile ? 140 : 220
    },
    parsedValueText: {
      textAlign: 'right',
      flexShrink: 1
    },
    rawText: {
      ...spacings.mb
    }
  })

export default getStyles
