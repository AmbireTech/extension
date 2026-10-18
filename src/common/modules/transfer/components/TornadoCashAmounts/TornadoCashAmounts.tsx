import { formatUnits, parseUnits } from 'ethers'
import React, { useMemo } from 'react'
import { View } from 'react-native'

import {
  getTornadoCashPoolsOfAsset,
  splitIntoTornadoCashNotes
} from '@ambire-common/libs/tornadoCash/amounts'
import { getSafeAmountFromFieldValue } from '@ambire-common/utils/numbers/formatters'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
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

/**
 * Tornado Cash holds fixed amounts only, so sending to it offers them as quick picks and shows
 * how the amount in the field is split into them - one part per pool deposit.
 */
const TornadoCashAmounts = ({ token, amount, onPick, disabled }: Props) => {
  const { t } = useTranslation()
  const pools = useMemo(() => getTornadoCashPoolsOfAsset(token.address).reverse(), [token.address])

  const split = useMemo(() => {
    const sanitizedAmount = getSafeAmountFromFieldValue(amount, token.decimals)
    if (!sanitizedAmount || !Number(sanitizedAmount)) return null

    return splitIntoTornadoCashNotes(token.address, parseUnits(sanitizedAmount, token.decimals))
  }, [amount, token.address, token.decimals])

  if (!pools.length) return null

  return (
    <View style={spacings.mtSm}>
      <View style={[flexbox.directionRow, flexbox.wrap]}>
        {pools.map(({ address, denomination, decimals, symbol }) => (
          <Button
            key={address}
            testID={`tornado-cash-amount-${formatAmount(denomination, decimals)}`}
            text={`${formatAmount(denomination, decimals)} ${symbol}`}
            size="small"
            type="secondary"
            hasBottomSpacing={false}
            disabled={disabled}
            style={[spacings.mrTy, spacings.mbTy]}
            onPress={() => onPick(formatUnits(denomination, decimals))}
          />
        ))}
      </View>
      {!!split && (
        <Text fontSize={12} appearance="secondaryText">
          {t('Sent as {{parts}}', {
            parts: split
              .map(
                ({ pool, count }) =>
                  `${count} × ${formatAmount(pool.denomination, pool.decimals)} ${pool.symbol}`
              )
              .join(' + ')
          })}
        </Text>
      )}
    </View>
  )
}

export default React.memo(TornadoCashAmounts)
