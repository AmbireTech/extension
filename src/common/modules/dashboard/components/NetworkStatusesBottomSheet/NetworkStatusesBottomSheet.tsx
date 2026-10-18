import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { PortfolioNetworkResult } from '@ambire-common/libs/portfolio/interfaces'
import { getPrivateAccountSeedId } from '@ambire-common/libs/privateAccount/privateAccount'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import NetworkStatusesHeader from './NetworkStatusesHeader'
import NetworkStatusRow from './NetworkStatusRow'
import PrivacyPoolsNetworkStatuses from './PrivacyPoolsNetworkStatuses'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  sheetRef: ReturnType<typeof useModalize>['ref']
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
) => getPrivateAccountSeedId(state.privateAccount, 'privacyPools')

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

  return (
    <BottomSheet
      id="network-statuses"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      backgroundColor="primaryBackground"
      isScrollEnabled={false}
      containerInnerWrapperStyles={flexbox.flex1}
    >
      <Text fontSize={20} weight="semiBold" style={spacings.mbLg}>
        {t('Network Statuses')}
      </Text>

      {privacyPoolsAccountId ? (
        <PrivacyPoolsNetworkStatuses />
      ) : (
        <>
          {/* Table Header */}
          <NetworkStatusesHeader networkLabel={t('Network')} columns={portfolioColumns} />
          <ScrollView style={flexbox.flex1} contentContainerStyle={spacings.ptTy}>
            {/* Table Rows */}
            {sortedNetworks.map(
              ({ networkKey, totalTime, isLoading, result, lastUpdatedAt, name }) => (
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
              )
            )}
          </ScrollView>
        </>
      )}
    </BottomSheet>
  )
}

export default memo(NetworkStatusesBottomSheet)
