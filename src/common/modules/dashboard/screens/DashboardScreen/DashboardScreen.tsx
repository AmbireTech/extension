import React, { useMemo } from 'react'
import { RefreshControl } from 'react-native'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Wrapper from '@common/components/Wrapper'
import useAccounts from '@common/hooks/useAccounts'
import useNetwork from '@common/hooks/useNetwork'
import usePortfolio from '@common/hooks/usePortfolio'
import Assets from '@common/modules/dashboard/components/Assets'
import Balances from '@common/modules/dashboard/components/Balances'
import PromoBanner from '@common/modules/dashboard/components/PromoBanner'
import { AssetsToggleProvider } from '@common/modules/dashboard/contexts/assetsToggleContext'
import colors from '@common/styles/colors'

const DashboardScreen = () => {
  const {
    loadBalance,
    isCurrNetworkBalanceLoading,
    balancesByNetworksLoading,
    balance,
    otherBalances,
    tokens,
    collectibles,
    extraTokens,
    hiddenTokens,
    hiddenCollectibles,
    onAddExtraToken,
    onAddHiddenToken,
    onRemoveExtraToken,
    onRemoveHiddenToken,
    onAddHiddenCollectible,
    onRemoveHiddenCollectible
  } = usePortfolio()
  const { network, setNetwork } = useNetwork()
  const { selectedAcc } = useAccounts()

  const handleRefresh = () => {
    loadBalance()
  }

  return (
    <GradientBackgroundWrapper>
      <PromoBanner />
      <Wrapper
        hasBottomTabNav
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={colors.titan}
            progressBackgroundColor={colors.titan}
            enabled={!isCurrNetworkBalanceLoading}
          />
        }
      >
        <Balances
          balance={balance}
          otherBalances={otherBalances}
          isLoading={isCurrNetworkBalanceLoading && !!balancesByNetworksLoading}
          isCurrNetworkBalanceLoading={!!isCurrNetworkBalanceLoading}
          otherBalancesLoading={!!balancesByNetworksLoading}
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
            hiddenCollectibles={hiddenCollectibles}
            isCurrNetworkBalanceLoading={!!isCurrNetworkBalanceLoading}
            explorerUrl={network?.explorerUrl}
            networkId={network?.id}
            networkName={network?.name}
            selectedAcc={selectedAcc}
            onAddExtraToken={onAddExtraToken}
            onAddHiddenToken={onAddHiddenToken}
            onRemoveExtraToken={onRemoveExtraToken}
            onRemoveHiddenToken={onRemoveHiddenToken}
            onAddHiddenCollectible={onAddHiddenCollectible}
            onRemoveHiddenCollectible={onRemoveHiddenCollectible}
          />
        </AssetsToggleProvider>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default DashboardScreen
