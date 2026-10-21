import { formatUnits } from 'ethers'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsPoolStats as PoolStats } from '@ambire-common/interfaces/privacyPools'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
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
  tooltip?: string
}

/** One placeholder per row the numbers fill. */
const SKELETON_ROW_IDS = ['total', 'approved', 'pending', 'deposits24h', 'withdrawals24h']

const selectChains = (state: AllControllersMappingType['PrivacyPoolsController']) => state.chains

const Label = React.memo(
  ({ text, tooltipId, tooltip }: { text: string; tooltipId?: string; tooltip?: string }) => (
    <Text
      weight="medium"
      fontSize={14}
      appearance="secondaryText"
      numberOfLines={1}
      ellipsizeMode="tail"
      dataSet={
        tooltipId && tooltip
          ? createGlobalTooltipDataSet({ id: tooltipId, content: tooltip })
          : undefined
      }
    >
      {text}
    </Text>
  )
)

/**
 * The numbers of a token's pool, as rows of the token details' "About" (see `TokenData`): what it holds,
 * how many deposits a withdrawal hides among, and the last day's activity. Read from this device's
 * copy of the pool's history (see `PrivacyPoolsController.getPoolStats`), so they are reloaded
 * whenever the network is read again, and nothing is asked of anyone.
 */
const PrivacyPoolsPoolStats = ({ chainId, tokenAddress, symbol, decimals, price }: Props) => {
  const { t } = useTranslation()
  const { dispatchAndWait } = useController('PrivacyPoolsController')
  const { state: chains } = useController('PrivacyPoolsController', selectChains)
  const lastSyncedAt = chains?.[chainId]?.lastSyncedAt ?? null
  // Undefined while the first answer is on its way. Null before the network is read
  const [stats, setStats] = useState<PoolStats | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Only the latest request's answer is shown, and none after the screen is gone
  const latestRequestRef = useRef(0)

  useEffect(() => {
    latestRequestRef.current += 1
    const requestNumber = latestRequestRef.current

    // The previous numbers stay on screen until the new ones arrive
    dispatchAndWait<'getPoolStatsAndSendResToUi', PoolStats | null>({
      type: 'method',
      params: { method: 'getPoolStatsAndSendResToUi', args: [chainId, tokenAddress] }
    })
      .then((result) => {
        if (requestNumber !== latestRequestRef.current) return
        setStats(result)
        setLoadError(null)
      })
      .catch((error) => {
        // Already reported by the controller
        console.error('privacyPools: could not load the pool stats', error)
        if (requestNumber === latestRequestRef.current) setLoadError(error.message)
      })

    return () => {
      latestRequestRef.current += 1
    }
  }, [chainId, dispatchAndWait, lastSyncedAt, tokenAddress])

  const rows: Row[] = useMemo(() => {
    if (!stats) return []

    const formatAmount = (amount: bigint) =>
      `${formatDecimals(Number(formatUnits(amount, decimals)), 'amount')} ${symbol}`
    // Without a price only the amount is known, so it is the value itself
    const formatValue = (amount: bigint) =>
      price === null ? null : formatDecimals(Number(formatUnits(amount, decimals)) * price, 'value')
    const totalValue = formatValue(stats.totalAmount)
    const pendingValue = formatValue(stats.pendingAmount)

    return [
      {
        id: 'total',
        label: t('Total value locked'),
        tooltip: t('Everything held in this pool right now, by everyone who uses it.'),
        value: totalValue ?? formatAmount(stats.totalAmount),
        subValue: totalValue ? formatAmount(stats.totalAmount) : undefined
      },
      {
        id: 'approved',
        label: t('Verified deposits'),
        value: formatDecimals(stats.approvedDepositsCount, 'noDecimal'),
        tooltip: t(
          'Sending from the pool hides you among everyone who deposited, so the more deposits, the more private it is.'
        )
      },
      {
        id: 'pending',
        label: t('Pending deposits'),
        value: formatDecimals(stats.pendingDepositsCount, 'noDecimal'),
        subValue: stats.pendingDepositsCount
          ? [pendingValue, formatAmount(stats.pendingAmount)].filter(Boolean).join(' · ')
          : undefined,
        tooltip: t('New deposits are checked before they can be sent. This takes up to 7 days.')
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

  // Nothing to show before the network is read: the screen is reached only after, so it is brief
  if (stats === null && !loadError) return null

  if (loadError && !stats)
    return (
      <Text fontSize={14} appearance="secondaryText">
        {t('Could not load the numbers of this pool.')}
      </Text>
    )

  if (stats === undefined)
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
      {rows.map(({ id, label, value, subValue, tooltip }, index) => (
        <View
          key={id}
          style={[
            flexbox.directionRow,
            flexbox.justifySpaceBetween,
            flexbox.alignStart,
            index < rows.length - 1 && spacings.mbSm
          ]}
        >
          <Label text={label} tooltipId={`privacy-pools-pool-stats-${id}`} tooltip={tooltip} />
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
