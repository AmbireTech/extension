import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  card: ViewStyle
  divider: ViewStyle
  addOwnerIcon: ViewStyle
  addOwnerDisabled: ViewStyle
  stepper: ViewStyle
  stepperButton: ViewStyle
  stepperButtonDisabled: ViewStyle
  stepperDivider: ViewStyle
  minusSign: TextStyle
}

const ADD_OWNER_ICON_SIZE = 32
const STEPPER_HEIGHT = 36

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    card: {
      ...common.borderRadiusPrimary,
      ...spacings.phSm,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      backgroundColor: theme.secondaryBackground
    },
    divider: {
      height: 1,
      backgroundColor: theme.secondaryBorder
    },
    addOwnerDisabled: {
      opacity: 0.4
    },
    addOwnerIcon: {
      ...flexbox.center,
      width: ADD_OWNER_ICON_SIZE,
      height: ADD_OWNER_ICON_SIZE,
      borderRadius: ADD_OWNER_ICON_SIZE / 2,
      backgroundColor: theme.primaryAccent100
    },
    stepper: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      height: STEPPER_HEIGHT,
      borderRadius: STEPPER_HEIGHT / 2,
      backgroundColor: theme.hoverBackground
    },
    stepperButton: {
      ...flexbox.center,
      ...spacings.phSm,
      height: STEPPER_HEIGHT
    },
    stepperButtonDisabled: {
      opacity: 0.4
    },
    stepperDivider: {
      width: 1,
      height: STEPPER_HEIGHT / 2,
      backgroundColor: theme.secondaryBorder
    },
    minusSign: {
      // Sized and centered to match the 18px plus icon in the other stepper button
      fontSize: 22,
      lineHeight: 22,
      textAlign: 'center',
      color: theme.primaryText
    }
  })

export default getStyles
