import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  ownerRow: ViewStyle
  removeOwnerButton: ViewStyle
  confirmationsSection: ViewStyle
  stepperButton: ViewStyle
  stepperButtonDisabled: ViewStyle
  minusSign: TextStyle
  stepperValue: TextStyle
}

const STEPPER_BUTTON_SIZE = 32
const REMOVE_OWNER_BUTTON_SIZE = 32

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    ownerRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.phSm,
      ...spacings.pvTy,
      ...common.borderRadiusPrimary,
      borderWidth: 1,
      borderColor: theme.secondaryBorder
    },
    removeOwnerButton: {
      ...flexbox.center,
      ...spacings.mlTy,
      width: REMOVE_OWNER_BUTTON_SIZE,
      height: REMOVE_OWNER_BUTTON_SIZE,
      borderRadius: REMOVE_OWNER_BUTTON_SIZE / 2,
      backgroundColor: theme.secondaryBackground
    },
    confirmationsSection: {
      // No left padding, so the title lines up with the rest of the form
      ...spacings.prSm,
      ...spacings.pvSm,
      ...spacings.mtLg,
      ...common.borderRadiusPrimary,
      borderWidth: 1,
      borderColor: theme.secondaryBorder
    },
    stepperButton: {
      ...flexbox.center,
      width: STEPPER_BUTTON_SIZE,
      height: STEPPER_BUTTON_SIZE,
      borderRadius: STEPPER_BUTTON_SIZE / 2,
      borderWidth: 1,
      borderColor: theme.secondaryBorder
    },
    stepperButtonDisabled: {
      opacity: 0.5
    },
    minusSign: {
      // Sized and centered to match the 18px plus icon in the other stepper button
      fontSize: 22,
      lineHeight: 22,
      textAlign: 'center'
    },
    stepperValue: {
      ...spacings.mhSm,
      minWidth: 16,
      textAlign: 'center'
    }
  })

export default getStyles
