import React, { FC, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import NetworkIcon from '@common/components/NetworkIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { PrivacyPoolsNetworkRow } from '@web/modules/privacy-pools/hooks/usePrivacyPools/usePrivacyPools'
import { formatElapsed } from '@web/modules/privacy-pools/utils/time'

import getStyles from './styles'

interface Props {
  rows: PrivacyPoolsNetworkRow[]
  onSync: (chainId: string) => void
}

// A row this fresh says "checked just now" rather than a countable age - below it the number would
// change while the user reads it.
const JUST_SYNCED_THRESHOLD_IN_MS = 5 * 1000
// Only the elapsed counter needs a tick this fast; it runs only while something is being read.
const ELAPSED_TICK_IN_MS = 1000
// Ages are shown in whole minutes, so a slower tick is enough once nothing is running.
const IDLE_TICK_IN_MS = 30 * 1000

/**
 * One row per supported network, each read on its own.
 *
 * Per network rather than all at once because the cost differs by orders of magnitude: a first read
 * walks the chain from the entrypoint's deployment block in 5000-block steps, which is minutes on
 * Sepolia and far more on Ethereum. Starting every network from one button would mean waiting for
 * the slowest before seeing any of them.
 *
 * The progress is deliberately indeterminate. The SDK's `sync()` returns void and reports nothing
 * while it runs - neither the block cursor nor a commitment count is observable - so there is no
 * numerator to build a percentage from. What is available is the elapsed time, which is what
 * distinguishes slow from hung. A fabricated percentage that stalls at 90% would be worse than
 * none.
 */
const PrivacyPoolsNetworks: FC<Props> = ({ rows, onSync }) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  const isAnyActive = useMemo(
    () => rows.some((row) => row.syncStatus === 'syncing' || row.syncStatus === 'initializing'),
    [rows]
  )

  // Re-renders the rows so the elapsed counter and the "checked N minutes ago" labels advance.
  // Ticks fast only while something is in flight, so an idle screen isn't re-rendering every second
  // for a label that changes once a minute.
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(
      () => setNow(Date.now()),
      isAnyActive ? ELAPSED_TICK_IN_MS : IDLE_TICK_IN_MS
    )

    return () => clearInterval(interval)
  }, [isAnyActive])

  if (!rows.length) return null

  return (
    <View style={styles.container}>
      {rows.map((row, index) => {
        const isFirstLoad = row.syncStatus === 'initializing'
        const isActive = isFirstLoad || row.syncStatus === 'syncing'
        const elapsed = row.syncStartedAt ? formatElapsed(now - row.syncStartedAt) : ''

        const getStatusLabel = () => {
          // The wording follows what the run actually is: building the local state from scratch, or
          // reading the tail since last time. They differ by orders of magnitude, so each carries
          // its own expectation next to the timer - a running counter with nothing to compare it
          // against says nothing about whether four minutes is normal or stuck.
          if (isFirstLoad) return t('Reading the whole network · {{elapsed}}', { elapsed })
          if (isActive) return t('Checking · {{elapsed}} · usually seconds', { elapsed })

          // An error wins over the age: a stale balance with a failed refresh must not read as
          // merely old, since the reason it is old is the thing the user can act on.
          if (row.error) return t('Could not check')
          if (!row.lastSyncedAt) return t('Not checked yet')

          const age = now - row.lastSyncedAt
          if (age < JUST_SYNCED_THRESHOLD_IN_MS) return t('Checked just now')

          const minutes = Math.floor(age / 60000)
          if (minutes < 1) return t('Checked seconds ago')
          if (minutes < 60) return t('Checked {{minutes}} min ago', { minutes })

          return t('Checked {{hours}} h ago', { hours: Math.floor(minutes / 60) })
        }

        const getActionLabel = () => {
          if (row.error) return t('Try again')
          if (row.needsFirstLoad) return t('Check')

          return t('Refresh')
        }

        // Said on the row rather than in a banner above, because it is what the button next to it
        // is about to do - and only this row's button, since the other network may already be read.
        const description =
          !isActive && row.needsFirstLoad && !row.error
            ? t('The first check reads this network from the start, which takes a while.')
            : row.error

        return (
          <View key={row.chainId} style={[styles.row, index === rows.length - 1 && styles.lastRow]}>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <NetworkIcon id={row.chainId} size={20} withTooltip={false} />
              <Text fontSize={12} weight="medium" style={spacings.mlTy} numberOfLines={1}>
                {row.networkName}
              </Text>
              <View style={flexbox.flex1} />
              <Text
                fontSize={12}
                weight="number_regular"
                color={row.error && !isActive ? theme.errorText : theme.secondaryText}
                numberOfLines={1}
              >
                {getStatusLabel()}
              </Text>
              {/* Only this network is read, never the others: that is the whole point of the row. */}
              {!isActive && (
                <Text
                  testID={`privacy-pools-sync-${row.chainId}`}
                  fontSize={12}
                  weight="medium"
                  color={theme.primaryAccent}
                  onPress={() => onSync(row.chainId)}
                  style={spacings.mlTy}
                >
                  {getActionLabel()}
                </Text>
              )}
            </View>

            {!!description && (
              <Text
                fontSize={11}
                color={row.error && !isActive ? theme.errorText : theme.secondaryText}
                style={spacings.mtMi}
              >
                {description}
              </Text>
            )}

            {/* An indeterminate bar rather than a progress one - see the component comment. The
            pulse is what says "still working" during the minutes a first read takes. */}
            {isActive && (
              <SkeletonLoader width="100%" height={3} borderRadius={2} style={styles.bar} />
            )}
          </View>
        )
      })}
    </View>
  )
}

export default React.memo(PrivacyPoolsNetworks)
