import { formatUnits, parseUnits } from 'ethers'
import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { getTornadoCashPoolsOfAsset } from '@ambire-common/libs/tornadoCash/amounts'
import { getSafeAmountFromFieldValue } from '@ambire-common/utils/numbers/formatters'
import Text from '@common/components/Text'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import type { TokenResult } from '@ambire-common/libs/portfolio'

type Props = {
  token: TokenResult
  /** The amount in the field, in token units. */
  amount: string
  onPick: (amount: string) => void
  disabled?: boolean
}

/** An amount in token units without a needless ".0". */
const formatAmount = (amount: bigint, decimals: number) => {
  const formatted = formatUnits(amount, decimals)
  return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted
}

const toAmountWei = (amount: string, decimals: number) => {
  const sanitizedAmount = getSafeAmountFromFieldValue(amount, decimals)
  if (!sanitizedAmount) return null

  try {
    return parseUnits(sanitizedAmount, decimals)
  } catch {
    return null
  }
}

type PillProps = {
  text: string
  isSelected: boolean
  disabled?: boolean
  testID: string
  onPress: () => void
}

/** Shaped and colored like the amount field's "Max" pill, so the two read as one group. */
const AmountPill = React.memo(({ text, isSelected, disabled, testID, onPress }: PillProps) => {
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.primaryAccent100,
      to: hexToRgba(theme.primaryAccent200, 0.16)
    },
    forceHoveredStyle: isSelected
  })

  return (
    <AnimatedPressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={[
        spacings.phSm,
        spacings.mrTy,
        spacings.mbTy,
        {
          paddingVertical: 2,
          borderRadius: 11,
          borderWidth: 1,
          borderColor: isSelected ? theme.primary : 'transparent'
        },
        animStyle,
        disabled && { opacity: 0.5 }
      ]}
      {...bindAnim}
    >
      <Text fontSize={12} weight="medium" appearance="primary">
        {text}
      </Text>
    </AnimatedPressable>
  )
})

/** Tornado Cash holds fixed amounts only, so sending to it offers them as quick picks. */
const TornadoCashAmounts = ({ token, amount, onPick, disabled }: Props) => {
  const pools = useMemo(() => getTornadoCashPoolsOfAsset(token.address).reverse(), [token.address])
  const amountWei = useMemo(() => toAmountWei(amount, token.decimals), [amount, token.decimals])

  const handlePick = useCallback(
    (denomination: bigint, decimals: number) => onPick(formatUnits(denomination, decimals)),
    [onPick]
  )

  if (!pools.length) return null

  return (
    <View style={[flexbox.directionRow, flexbox.wrap, spacings.mtTy, spacings.phTy]}>
      {pools.map(({ address, denomination, decimals, symbol }) => (
        <AmountPill
          key={address}
          testID={`tornado-cash-amount-${formatAmount(denomination, decimals)}`}
          text={`${formatAmount(denomination, decimals)} ${symbol}`}
          isSelected={amountWei === denomination}
          disabled={disabled}
          onPress={() => handlePick(denomination, decimals)}
        />
      ))}
    </View>
  )
}

export default React.memo(TornadoCashAmounts)
