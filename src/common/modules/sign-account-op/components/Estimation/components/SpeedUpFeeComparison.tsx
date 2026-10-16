import { formatUnits } from 'ethers'
import React, { memo, useMemo } from 'react'
import { View } from 'react-native'

import { getTokenUsdAmount } from '@ambire-common/controllers/signAccountOp/helper'
import { TokenResult } from '@ambire-common/libs/portfolio'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  /** The token both fees are paid in. It's the same for both, as it's locked during a speed up */
  token: TokenResult
  /** The fee paid for the pending transaction that is being sped up */
  originalAmount: bigint
  /** The fee of the selected speed */
  newAmount: bigint
}

/**
 * Shown below the fee during a speed up, so the user sees how much more
 * the replacement costs compared to the pending transaction.
 */
const SpeedUpFeeComparison = ({ token, originalAmount, newAmount }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const { formattedOriginal, increaseText } = useMemo(() => {
    // 'price' keeps the significant decimals, so small fees don't all show as "<$0.01"
    const formatFee = (amount: bigint) => {
      const usd = getTokenUsdAmount(token, amount)
      if (usd) return formatDecimals(Number(usd), 'price')

      return `${formatDecimals(Number(formatUnits(amount, token.decimals)), 'amount')} ${
        token.symbol
      }`
    }

    const increase = newAmount - originalAmount
    // The new fee can end up lower only if the transaction now needs less gas
    if (increase <= 0n || originalAmount === 0n) {
      return { formattedOriginal: formatFee(originalAmount), increaseText: null }
    }

    const increasePercent = Math.round(Number((increase * 10000n) / originalAmount) / 100)

    return {
      formattedOriginal: formatFee(originalAmount),
      increaseText: t('+{{amount}} · {{percent}}% more', {
        amount: formatFee(increase),
        percent: increasePercent
      })
    }
  }, [newAmount, originalAmount, t, token])

  return (
    <View
      testID="speed-up-fee-comparison"
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.mtTy,
        { columnGap: SPACING_TY }
      ]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter, { flexShrink: 1 }]}>
        <Text fontSize={12} appearance="secondaryText" numberOfLines={1} style={spacings.mrMi}>
          {t('Original fee')}
        </Text>
        <Text
          fontSize={12}
          appearance="secondaryText"
          numberOfLines={1}
          style={{ textDecorationLine: 'line-through' }}
        >
          {formattedOriginal}
        </Text>
      </View>
      {!!increaseText && (
        <View
          style={[
            spacings.phTy,
            { borderRadius: 6, backgroundColor: theme.infoBackground, paddingVertical: 2 }
          ]}
        >
          <Text fontSize={12} weight="medium" appearance="infoText" numberOfLines={1}>
            {increaseText}
          </Text>
        </View>
      )}
    </View>
  )
}

export default memo(SpeedUpFeeComparison)
