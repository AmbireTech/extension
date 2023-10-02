import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl } from 'react-native'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import useAccounts from '@common/hooks/useAccounts'
import useNetwork from '@common/hooks/useNetwork'
import usePortfolio from '@common/hooks/usePortfolio'
import Assets from '@common/modules/dashboard/components/Assets'
import Balances from '@common/modules/dashboard/components/Balances'
import Banner from '@common/modules/dashboard/components/Banner/Banner'
import { AssetsToggleProvider } from '@common/modules/dashboard/contexts/assetsToggleContext'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'

const DashboardScreen = () => {
  const {
    loadBalance,
    loadProtocols,
    isCurrNetworkBalanceLoading,
    isCurrNetworkProtocolsLoading,
    balancesByNetworksLoading,
    allBalances,
    protocols,
    tokens,
    collectibles,
    extraTokens,
    hiddenTokens,
    onAddExtraToken,
    onAddHiddenToken,
    onRemoveExtraToken,
    onRemoveHiddenToken
  } = usePortfolio()
  const { network, setNetwork } = useNetwork()
  const { selectedAcc } = useAccounts()
  const { t } = useTranslation()

  const allBalancesLoading = useMemo(
    () => Object.entries(balancesByNetworksLoading).find((ntw) => ntw[1]),
    [balancesByNetworksLoading]
  )

  const handleRefresh = () => {
    loadBalance()
    loadProtocols()
  }

  return (
    <GradientBackgroundWrapper>
      <Wrapper
        hasBottomTabNav
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={colors.titan}
            progressBackgroundColor={colors.titan}
            enabled={!isCurrNetworkBalanceLoading && !isCurrNetworkProtocolsLoading}
          />
        }
      >
        <Banner />
        <Balances
          allBalances={allBalances}
          isLoading={isCurrNetworkBalanceLoading && !!allBalancesLoading}
          isCurrNetworkBalanceLoading={!!isCurrNetworkBalanceLoading}
          allBalancesLoading={!!allBalancesLoading}
          networkId={network?.id}
          networkName={network?.name}
          setNetwork={setNetwork}
          account={selectedAcc}
        />
        <AssetsToggleProvider>
          <Assets
            tokens={tokens}
            collectibles={collectibles}
            extraTokens={extraTokens}
            hiddenTokens={hiddenTokens}
            protocols={protocols}
            isCurrNetworkBalanceLoading={!!isCurrNetworkBalanceLoading}
            isCurrNetworkProtocolsLoading={!!isCurrNetworkProtocolsLoading}
            explorerUrl={network?.explorerUrl}
            networkId={network?.id}
            networkName={network?.name}
            selectedAcc={selectedAcc}
            onAddExtraToken={onAddExtraToken}
            onAddHiddenToken={onAddHiddenToken}
            onRemoveExtraToken={onRemoveExtraToken}
            onRemoveHiddenToken={onRemoveHiddenToken}
          />
        </AssetsToggleProvider>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default DashboardScreen
