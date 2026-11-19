import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { PortfolioNetworkResult } from '@ambire-common/libs/portfolio/interfaces'
import BottomSheet from '@common/components/BottomSheet'
import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import useSheetRef from '@common/components/BottomSheet/useSheetRef'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import NetworkStatusesHeader from './NetworkStatusesHeader'
import NetworkStatusRow from './NetworkStatusRow'
import PrivacyPoolsNetworkStatuses from './PrivacyPoolsNetworkStatuses'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  sheetRef: ReturnType<typeof useSheetRef>['ref']
  closeBottomSheet: () => void
}

/**
 * A bottom sheet that shows the time taken by each network to load, together
 * with a breakdown of the time taken for discovery, price updates, and deployless calls.
 *
 * It's not displayed in production and can be used to monitor the performance of the portfolio.
 * A Privacy Pools account gets `PrivacyPoolsNetworkStatuses` instead, shown in production too.
 */
const selectPortfolioState = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio?.portfolioState

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks
const selectPrivacyPoolsAccountId = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.privacyPoolsAccountId

const NetworkStatusesBottomSheet = ({ sheetRef, closeBottomSheet }: Props) => {
  const { t } = useTranslation()
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { state: portfolioState } = useController('SelectedAccountController', selectPortfolioState)
  const { state: privacyPoolsAccountId } = useController(
    'SelectedAccountController',
    selectPrivacyPoolsAccountId
  )
  const { theme } = useTheme()

  const portfolioColumns = useMemo(
    () => [
      { label: t('Total Time'), flex: 1.5 },
      { label: t('Discovery'), flex: 1 },
      { label: t('Prices'), flex: 1 },
      { label: t('Deployless'), flex: 1 }
    ],
    [t]
  )
  const privacyPoolsColumns = useMemo(
    () => [
      { label: t('Initial sync'), flex: 1 },
      { label: t('Initial sync time'), flex: 1 },
      { label: t('Last sync time'), flex: 1 }
    ],
    [t]
  )
  const tableHeader = useMemo(
    () => (
      <NetworkStatusesHeader
        networkLabel={t('Network')}
        columns={privacyPoolsAccountId ? privacyPoolsColumns : portfolioColumns}
      />
    ),
    [portfolioColumns, privacyPoolsAccountId, privacyPoolsColumns, t]
  )

  const sortedNetworks = useMemo(() => {
    return networks
      .map((network) => {
        const networkKey = network.chainId.toString()
        const result = portfolioState[networkKey]?.result as PortfolioNetworkResult | undefined
        const lastUpdatedAt = portfolioState[networkKey]?.lastSuccessfulUpdate

        const totalTime =
          (result?.discoveryTime || 0) +
          (result?.priceUpdateTime || 0) +
          (result?.oracleCallTime || 0)

        return {
          networkKey,
          result,
          isLoading: !portfolioState[networkKey] || portfolioState[networkKey].isLoading,
          lastUpdatedAt,
          totalTime,
          name: network.name
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
  }, [networks, portfolioState])

  const tableRows = privacyPoolsAccountId ? (
    <PrivacyPoolsNetworkStatuses />
  ) : (
    sortedNetworks.map(({ networkKey, totalTime, isLoading, result, lastUpdatedAt, name }) => (
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
    ))
  )

  // The sheet scrolls the rows itself, under its fixed header with the table header
  return (
    <BottomSheet
      id="network-statuses"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      backgroundColor="primaryBackground"
      HeaderComponent={tableHeader}
    >
      <SheetHeaderRow style={spacings.mbLg}>
        <Text fontSize={20} weight="semiBold">
          {t('Network Statuses')}
        </Text>
      </SheetHeaderRow>
      {tableRows}
    </BottomSheet>
  )
}

export default memo(NetworkStatusesBottomSheet)
