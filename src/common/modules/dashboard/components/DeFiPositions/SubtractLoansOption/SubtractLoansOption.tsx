import React, { FC, useCallback } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import Toggle from '@common/components/Toggle'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useMultiHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import { hexToRgba } from '@common/styles/utils/common'

import styles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectShouldSubtractBorrowedFunds = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.shouldSubtractBorrowedFunds

/**
 * Shown above the DeFi positions while the account has loans, so the user can see the balance
 * left after paying them back with one click. It changes the same setting as the General settings.
 */
const SubtractLoansOption: FC = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: shouldSubtractBorrowedFunds, dispatch: selectedAccountDispatch } = useController(
    'SelectedAccountController',
    selectShouldSubtractBorrowedFunds
  )
  const [bindAnim, animStyle] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: theme.secondaryBackground,
        to: theme.tertiaryBackground
      },
      {
        property: 'borderColor',
        from: hexToRgba(theme.primaryBorder, 0),
        to: theme.primaryBorder
      }
    ]
  })

  const toggle = useCallback(() => {
    selectedAccountDispatch({
      type: 'method',
      params: { method: 'setShouldSubtractBorrowedFunds', args: [!shouldSubtractBorrowedFunds] }
    })
  }, [selectedAccountDispatch, shouldSubtractBorrowedFunds])

  return (
    <AnimatedPressable
      onPress={toggle}
      style={[styles.container, animStyle]}
      accessibilityRole="switch"
      accessibilityState={{ checked: shouldSubtractBorrowedFunds }}
      testID="subtract-loans-option"
      {...bindAnim}
    >
      <Text fontSize={14} weight="medium" numberOfLines={1} style={styles.title}>
        {t('Subtract loans from balance')}
      </Text>
      {/* The whole card handles the press, so a click on the toggle doesn't switch it twice */}
      <View pointerEvents="none">
        <Toggle
          isOn={shouldSubtractBorrowedFunds}
          onToggle={toggle}
          trackStyle={styles.toggleTrack}
          testID="subtract-loans-toggle"
        />
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(SubtractLoansOption)
