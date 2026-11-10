import React, { FC, useCallback, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { formatPrivacyPoolsAmountNumber } from '@common/utils/privacyPools'

type ChipProps = {
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
const INFO_ICON_SIZE = 12
const DIMMED_OPACITY = 0.5
/** Matches the hovered `MaxButton`, which sits next to the chips. */
const SELECTED_HOVER_OPACITY = 0.16

const Chip: FC<ChipProps> = ({
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

const MemoizedChip = React.memo(Chip)

type Props = {
  amounts: bigint[]
  decimals: number
  /** The amount the form holds, so its chip shows as picked. Null when it holds none. */
  selectedAmount: bigint | null
  /** The most the user can send. Larger amounts show dimmed. */
  maxAmount: bigint
  onSelect: (amount: bigint) => void
  disabled?: boolean
  testID: string
  style?: ViewStyle
}

/**
 * Amounts that keep a Privacy Pools transfer hidden among others, to pick with one tap: common
 * deposit amounts, and amounts that send whole deposits. Amounts above `maxAmount` show dimmed.
 * Renders nothing without amounts.
 */
const PrivacyPoolsAmountChips: FC<Props> = ({
  amounts,
  decimals,
  selectedAmount,
  maxAmount,
  onSelect,
  disabled = false,
  testID,
  style
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const suggestedTooltip = useMemo(
    () =>
      createGlobalTooltipDataSet({
        id: `${testID}-suggested-tooltip`,
        title: t('Suggested amounts'),
        content: t('Many people send these amounts, so using one helps your transfer blend in.')
      }),
    [t, testID]
  )
  const chips = useMemo(
    () =>
      amounts.map((amount) => ({
        amount,
        key: amount.toString(),
        // The token shows right above, so the amount alone is enough
        label: formatPrivacyPoolsAmountNumber(amount, decimals)
      })),
    [amounts, decimals]
  )

  if (!chips.length) return null

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.wrap,
        flexbox.alignCenter,
        spacings.mtTy,
        { columnGap: SPACING_TY, rowGap: SPACING_MI },
        style
      ]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <Text fontSize={12} appearance="secondaryText" weight="medium">
          {t('Suggested')}
        </Text>
        <InfoIcon
          width={INFO_ICON_SIZE}
          height={INFO_ICON_SIZE}
          color={theme.iconSecondary}
          style={spacings.mlMi}
          dataSet={suggestedTooltip}
        />
      </View>
      {chips.map(({ amount, key, label }) => (
        <MemoizedChip
          key={key}
          amount={amount}
          label={label}
          isSelected={amount === selectedAmount}
          isAboveMax={amount > maxAmount}
          disabled={disabled}
          onSelect={onSelect}
          testID={`${testID}-${key}`}
        />
      ))}
    </View>
  )
}

export default React.memo(PrivacyPoolsAmountChips)
