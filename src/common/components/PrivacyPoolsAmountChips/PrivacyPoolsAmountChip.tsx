import React, { FC, useCallback } from 'react'

import Text from '@common/components/Text'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  amount: bigint
  label: string
  isSelected: boolean
  /** Above what the user can send. Still selectable, as the user may add funds first. */
  isAboveMax: boolean
  disabled: boolean
  onSelect: (amount: bigint) => void
  testID: string
}

const CHIP_HEIGHT = 28
const DIMMED_OPACITY = 0.5
/** Matches the hovered `MaxButton`, which sits next to the chips. */
const SELECTED_HOVER_OPACITY = 0.16

/** One suggested amount, picked with a tap. */
const PrivacyPoolsAmountChip: FC<Props> = ({
  amount,
  label,
  isSelected,
  isAboveMax,
  disabled,
  onSelect,
  testID
}) => {
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    // A picked chip is tinted like the Max button, the others are a shade lighter than the form
    values: isSelected
      ? {
          from: theme.primaryAccent100,
          to: hexToRgba(theme.primaryAccent200, SELECTED_HOVER_OPACITY)
        }
      : { from: theme.tertiaryBackground, to: theme.hoverBackground }
  })
  const handlePress = useCallback(() => onSelect(amount), [amount, onSelect])

  return (
    <AnimatedPressable
      testID={testID}
      disabled={disabled}
      onPress={handlePress}
      style={[
        flexbox.center,
        spacings.phSm,
        {
          height: CHIP_HEIGHT,
          borderRadius: CHIP_HEIGHT / 2,
          opacity: disabled || isAboveMax ? DIMMED_OPACITY : 1
        },
        animStyle
      ]}
      {...bindAnim}
    >
      <Text
        fontSize={12}
        weight={isSelected ? 'semiBold' : 'medium'}
        appearance={isSelected ? 'primary' : 'primaryText'}
      >
        {label}
      </Text>
    </AnimatedPressable>
  )
}

export { CHIP_HEIGHT }
export default React.memo(PrivacyPoolsAmountChip)
