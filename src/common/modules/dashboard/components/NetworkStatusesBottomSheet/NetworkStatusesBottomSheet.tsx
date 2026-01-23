import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { PortfolioNetworkResult } from '@ambire-common/libs/portfolio/interfaces'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import NetworkStatusRow from './NetworkStatusRow'

interface Props {
  sheetRef: ReturnType<typeof useModalize>['ref']
  closeBottomSheet: () => void
}

/**
 * A bottom sheet that shows the time taken by each network to load, together
 * with a breakdown of the time taken for discovery, price updates, and deployless calls.
 *
 * It's displayed in Ambire Next only and can be used to monitor the performance of the portfolio.
 */
const NetworkStatusesBottomSheet = ({ sheetRef, closeBottomSheet }: Props) => {
  const { t } = useTranslation()
  const { networks } = useNetworksControllerState()
  const { portfolio } = useSelectedAccountControllerState()
  const { theme } = useTheme()

  const networkDataMap = networks.reduce(
    (acc, network) => {
      acc[network.chainId.toString()] = network
      return acc
    },
    {} as Record<string, (typeof networks)[0]>
  )

  const sortedNetworks = useMemo(() => {
    const networkKeys = Object.keys(portfolio.portfolioState).filter((key) => !!networkDataMap[key])

    return networkKeys
      .map((networkKey) => {
        const result = portfolio.portfolioState[networkKey]?.result as
          | PortfolioNetworkResult
          | undefined
        const lastUpdatedAt = portfolio.portfolioState[networkKey]?.lastSuccessfulUpdate

        const totalTime =
          (result?.discoveryTime || 0) +
          (result?.priceUpdateTime || 0) +
          (result?.oracleCallTime || 0)

        return {
          networkKey,
          result,
          isLoading: !!portfolio.portfolioState[networkKey]?.isLoading,
          lastUpdatedAt,
          totalTime,
          name: networkDataMap[networkKey]?.name || t('Unknown Network')
        }
      })
      .sort((a, b) => {
        // Put networks with no data at the end
        if (!a.result && !b.result) return 0
        if (!a.result) return 1
        if (!b.result) return -1
        // Loading networks first
        if (a.isLoading && b.isLoading) return 0
        if (a.isLoading) return -1
        if (b.isLoading) return 1

        // Slowest first
        return b.totalTime - a.totalTime
      })
  }, [portfolio.portfolioState, networkDataMap, t])

  return (
    <BottomSheet
      id="network-statuses"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      backgroundColor="primaryBackground"
    >
      <Text fontSize={20} weight="semiBold" style={spacings.mbLg}>
        {t('Network Statuses')}
      </Text>

      {/* Table Header */}
      <View
        style={[
          flexbox.directionRow,
          spacings.mbTy,
          spacings.pbTy,
          {
            borderBottomWidth: 2,
            borderBottomColor: theme.secondaryBackground
          }
        ]}
      >
        <View style={{ flex: 2 }}>
          <Text fontSize={12} weight="semiBold" appearance="secondaryText" style={spacings.plTy}>
            {t('Network')}
          </Text>
        </View>
        <Text
          fontSize={12}
          weight="semiBold"
          appearance="secondaryText"
          style={{ flex: 1.5, textAlign: 'center' }}
        >
          {t('Total Time')}
        </Text>
        <Text
          fontSize={12}
          weight="semiBold"
          appearance="secondaryText"
          style={{ ...flexbox.flex1, textAlign: 'center' }}
        >
          {t('Discovery')}
        </Text>
        <Text
          fontSize={12}
          weight="semiBold"
          appearance="secondaryText"
          style={{ ...flexbox.flex1, textAlign: 'center' }}
        >
          {t('Prices')}
        </Text>
        <Text
          fontSize={12}
          weight="semiBold"
          appearance="secondaryText"
          style={{ ...flexbox.flex1, textAlign: 'center' }}
        >
          {t('Deployless')}
        </Text>
      </View>

      {/* Table Rows */}
      {sortedNetworks.map(({ networkKey, totalTime, isLoading, result, lastUpdatedAt, name }) => (
        <NetworkStatusRow
          key={networkKey}
          networkKey={networkKey}
          name={name as string}
          lastUpdatedAt={lastUpdatedAt}
          totalTime={totalTime}
          isLoading={isLoading}
          result={result}
          theme={theme}
        />
      ))}
    </BottomSheet>
  )
}

export default memo(NetworkStatusesBottomSheet)
