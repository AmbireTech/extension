import { formatUnits } from 'ethers'
import React, { useMemo } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsChainPoolStats } from '@ambire-common/interfaces/privacyPools'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  /** The numbers of the token's chain, or undefined until the background has read the network. */
  chainPoolStats: PrivacyPoolsChainPoolStats | undefined
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
 * asked of anyone. Render it only when `shouldShowPrivacyPoolsPoolStats` - a pool not in the
 * chain's config never gets numbers.
 */
const PrivacyPoolsPoolStats = ({
  chainPoolStats,
  tokenAddress,
  symbol,
  decimals,
  price
}: Props) => {
  const { t } = useTranslation()
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
  if (!chainPoolStats)
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

  // Never computed for this pool - see `shouldShowPrivacyPoolsPoolStats`
  if (!stats) return null

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

/**
 * Whether a token's pool numbers take a place on the screen: their placeholders until its chain is
 * read, then the numbers or why they could not be read. False once its chain is read without them,
 * as for a pool not in the chain's config.
 */
export const shouldShowPrivacyPoolsPoolStats = (
  chainPoolStats: PrivacyPoolsChainPoolStats | undefined,
  tokenAddress: string
) =>
  !chainPoolStats || !!chainPoolStats.error || !!chainPoolStats.byToken[tokenAddress.toLowerCase()]

export default React.memo(PrivacyPoolsPoolStats)
