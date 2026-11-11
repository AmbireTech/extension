import React, { FC, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import PrivacyPoolsLogoIcon from '@common/assets/svg/PrivacyPoolsLogoIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { formatPrivacyPoolsAmountNumber } from '@common/utils/privacyPools'

import PrivacyPoolsAmountChip, { CHIP_HEIGHT } from './PrivacyPoolsAmountChip'

const LOGO_SIZE = 16

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
 * Common deposit amounts that keep a Privacy Pools transfer hidden among others, to pick with one
 * tap. Amounts above `maxAmount` show dimmed.
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
      {/* Not a chip, it only names the row through its tooltip */}
      <View
        style={[
          flexbox.center,
          {
            width: CHIP_HEIGHT,
            height: CHIP_HEIGHT,
            borderRadius: CHIP_HEIGHT / 2,
            backgroundColor: theme.privacyPoolsBackground
          }
        ]}
        dataSet={suggestedTooltip}
      >
        <PrivacyPoolsLogoIcon width={LOGO_SIZE} height={LOGO_SIZE} />
      </View>
      {chips.map(({ amount, key, label }) => (
        <PrivacyPoolsAmountChip
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
