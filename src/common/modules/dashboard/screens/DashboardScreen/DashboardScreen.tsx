import React, { useMemo } from 'react'
import { RefreshControl } from 'react-native'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Wrapper from '@common/components/Wrapper'
import useAccounts from '@common/hooks/useAccounts'
import useNetwork from '@common/hooks/useNetwork'
import usePortfolio from '@common/hooks/usePortfolio'
import Assets from '@common/modules/dashboard/components/Assets'
import Balances from '@common/modules/dashboard/components/Balances'
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
    onAddExtraToken,
    onAddHiddenToken,
    onRemoveExtraToken,
    onRemoveHiddenToken
  } = usePortfolio()
  const { network, setNetwork } = useNetwork()
  const { selectedAcc } = useAccounts()

  const otherBalancesLoading = useMemo(
    () => Object.entries(balancesByNetworksLoading).find((ntw) => ntw[0] !== network?.id && ntw[1]),
    [balancesByNetworksLoading, network?.id]
  )

  const handleRefresh = () => {
    loadBalance()
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
            enabled={!isCurrNetworkBalanceLoading}
          />
        }
      >
        <Balances
          balanceTruncated={balance.total?.truncated}
          balanceDecimals={balance.total?.decimals}
          otherBalances={otherBalances}
          isLoading={isCurrNetworkBalanceLoading && !!otherBalancesLoading}
          isCurrNetworkBalanceLoading={!!isCurrNetworkBalanceLoading}
          otherBalancesLoading={!!otherBalancesLoading}
          networkId={network?.id}
          setNetwork={setNetwork}
          account={selectedAcc}
        />
        <AssetsToggleProvider>
          <Assets
            tokens={tokens}
            collectibles={collectibles}
            extraTokens={extraTokens}
            hiddenTokens={hiddenTokens}
            isCurrNetworkBalanceLoading={!!isCurrNetworkBalanceLoading}
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
