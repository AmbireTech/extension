import { formatUnits } from 'ethers'
import React, { useMemo } from 'react'
import { View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type Props = {
  chainId: string
  tokenAddress: string
  symbol: string
  decimals: number
  /** USD price of the token, or null when unknown. Then only the amount is shown. */
  price: number | null
}

type Row = {
  id: string
  label: string
  value: string
  /** A smaller line under the value, e.g. its amount in the token. */
  subValue?: string
}

/** One placeholder per row the numbers fill. */
const SKELETON_ROW_IDS = ['total', 'approved', 'deposits24h', 'withdrawals24h']

const selectPoolStats = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.poolStats

const Label = React.memo(({ text }: { text: string }) => (
  <Text
    weight="medium"
    fontSize={14}
    appearance="secondaryText"
    numberOfLines={1}
    ellipsizeMode="tail"
  >
    {text}
  </Text>
))

/**
 * The numbers of a token's pool, as rows of the token details' "About" (see `TokenData`): what it holds,
 * how many deposits a withdrawal hides among, and the last day's activity. Computed in the
 * background from this device's copy of the pool's history after every read of the network (see
 * `PrivacyPoolsController.poolStats`), so they are there when the screen opens, and nothing is
 * asked of anyone.
 */
const PrivacyPoolsPoolStats = ({ chainId, tokenAddress, symbol, decimals, price }: Props) => {
  const { t } = useTranslation()
  const { state: poolStats } = useController('PrivacyPoolsController', selectPoolStats)
  const chainPoolStats = poolStats?.[chainId]
  const stats = chainPoolStats?.byToken[tokenAddress.toLowerCase()]

  const rows: Row[] = useMemo(() => {
    if (!stats) return []

    const formatAmount = (amount: bigint) =>
      `${formatDecimals(Number(formatUnits(amount, decimals)), 'amount')} ${symbol}`
    // Without a price only the amount is known, so it is the value itself
    const formatValue = (amount: bigint) =>
      price === null ? null : formatDecimals(Number(formatUnits(amount, decimals)) * price, 'value')
    const totalValue = formatValue(stats.totalAmount)

    return [
      {
        id: 'total',
        label: t('Total value locked'),
        value: totalValue ?? formatAmount(stats.totalAmount),
        subValue: totalValue ? formatAmount(stats.totalAmount) : undefined
      },
      {
        id: 'approved',
        label: t('Verified deposits'),
        value: formatDecimals(stats.approvedDepositsCount, 'noDecimal')
      },
      {
        id: 'deposits24h',
        label: t('Deposits (24h)'),
        value: formatDecimals(stats.depositsCount24h, 'noDecimal')
      },
      {
        id: 'withdrawals24h',
        label: t('Withdrawals (24h)'),
        value: formatDecimals(stats.withdrawalsCount24h, 'noDecimal')
      }
    ]
  }, [decimals, price, stats, symbol, t])

  if (chainPoolStats?.error)
    return (
      <Text fontSize={14} appearance="secondaryText">
        {t('Could not load the numbers of this pool.')}
      </Text>
    )

  // Only until the background has read the network, which this screen is reached after
  if (!stats)
    return (
      <>
        {SKELETON_ROW_IDS.map((id, index) => (
          <SkeletonLoader
            key={id}
            width="100%"
            height={20}
            style={index < SKELETON_ROW_IDS.length - 1 ? spacings.mbSm : undefined}
          />
        ))}
      </>
    )

  return (
    <>
      {rows.map(({ id, label, value, subValue }, index) => (
        <View
          key={id}
          style={[
            flexbox.directionRow,
            flexbox.justifySpaceBetween,
            flexbox.alignStart,
            index < rows.length - 1 && spacings.mbSm
          ]}
        >
          <Label text={label} />
          <View style={[flexbox.alignEnd, spacings.mlSm]}>
            <Label text={value} />
            {!!subValue && (
              <Text fontSize={12} appearance="tertiaryText" weight="medium" numberOfLines={1}>
                {subValue}
              </Text>
            )}
          </View>
        </View>
      ))}
    </>
  )
}

export default React.memo(PrivacyPoolsPoolStats)
