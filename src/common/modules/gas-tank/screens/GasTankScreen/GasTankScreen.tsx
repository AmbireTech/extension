import useGasTankData from 'ambire-common/src/hooks/useGasTankData'
import { formatFloatTokenAmount } from 'ambire-common/src/services/formatter'
import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import GasTankIcon from '@common/assets/svg/GasTankIcon'
import BottomSheet from '@common/components/BottomSheet'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import CONFIG from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAccounts from '@common/hooks/useAccounts'
import useNetwork from '@common/hooks/useNetwork'
import usePortfolio from '@common/hooks/usePortfolio'
import useRelayerData from '@common/hooks/useRelayerData'
import useRequests from '@common/hooks/useRequests'
import useToast from '@common/hooks/useToast'
import GasTankBalance from '@common/modules/gas-tank/components/GasTankBalance'
import GasTankStateToggle from '@common/modules/gas-tank/components/GasTankStateToggle'
import GasTankTotalSave from '@common/modules/gas-tank/components/GasTankTotalSave'
import TokensList from '@common/modules/gas-tank/components/TokensList'
import TransactionHistoryList from '@common/modules/gas-tank/components/TransactionsHistoryList'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

const relayerURL = CONFIG.RELAYER_URL

const GasTankScreen = () => {
  const { t } = useTranslation()

  const { isCurrNetworkBalanceLoading, isCurrNetworkProtocolsLoading } = usePortfolio()
  const { network } = useNetwork()
  const { selectedAcc } = useAccounts()
  const { addRequest } = useRequests()
  const { addToast } = useToast()
  const portfolio = usePortfolio()

  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const {
    balancesRes,
    gasTankBalances,
    availableFeeAssets,
    totalSavedResult,
    gasTankFilledTxns,
    feeAssetsRes
  } = useGasTankData({
    relayerURL,
    selectedAcc,
    network,
    portfolio,
    useRelayerData
  })

  const totalSaved =
    totalSavedResult &&
    totalSavedResult.length &&
    formatFloatTokenAmount(
      totalSavedResult.map((i: any) => i.saved).reduce((a: any, b: any) => a + b),
      true,
      2
    )

  const totalCashBack =
    totalSavedResult &&
    totalSavedResult.length &&
    formatFloatTokenAmount(
      totalSavedResult.map((i: any) => i.cashback).reduce((a: any, b: any) => a + b),
      true,
      2
    )

  const sortedTokens = useMemo(
    () =>
      availableFeeAssets
        ?.filter((item: any) => !item.disableGasTankDeposit)
        .sort((a: any, b: any) => {
          const decreasing = b.balanceUSD - a.balanceUSD
          if (decreasing === 0) return a.symbol.toUpperCase().localeCompare(b.symbol.toUpperCase())
          return decreasing
        }),
    [availableFeeAssets]
  )

  return (
    <GradientBackgroundWrapper>
      <Wrapper hasBottomTabNav>
        {/* Since v3.11.0, gas tank is treated as "always enabled" */}
        {/* <GasTankStateToggle disabled={!gasTankBalances && !gasTankBalances?.length} /> */}
        <Text style={[spacings.mbSm, spacings.mhSm]} fontSize={12}>
          {t('The Ambire Gas Tank is your special account for paying gas and saving on gas fees.')}
          {'   '}
          <Text color={colors.heliotrope} fontSize={12} onPress={openBottomSheet}>{`${t(
            'learn more...'
          )}`}</Text>
        </Text>
        <Panel>
          <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mb]}>
            <GasTankBalance
              data={balancesRes && balancesRes.length ? balancesRes : []}
              totalBalance={
                gasTankBalances ? formatFloatTokenAmount(gasTankBalances, true, 2) : '0.00'
              }
              networkId={network?.id}
              balanceByTokensDisabled={!gasTankBalances && !gasTankBalances?.length}
            />
            <GasTankTotalSave
              totalSave={totalSaved || '0.00'}
              totalCashBack={totalCashBack || '0.00'}
              networkId={network?.id}
            />
          </View>
          <TokensList
            tokens={sortedTokens}
            isLoading={isCurrNetworkBalanceLoading || isCurrNetworkProtocolsLoading}
            networkId={network?.id}
            chainId={network?.chainId}
            selectedAcc={selectedAcc}
            addRequest={addRequest}
            addToast={addToast}
          />
        </Panel>
        <Panel>
          <TransactionHistoryList
            gasTankFilledTxns={gasTankFilledTxns || []}
            feeAssetsRes={feeAssetsRes || []}
            explorerUrl={network?.explorerUrl || ''}
            networkId={network?.id}
          />
        </Panel>
      </Wrapper>

      <BottomSheet
        id="gas-tank"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        cancelText="Close"
      >
        <View
          style={[
            flexboxStyles.directionRow,
            flexboxStyles.alignCenter,
            flexboxStyles.justifyCenter,
            spacings.mb
          ]}
        >
          <GasTankIcon />
          <Text fontSize={16} style={spacings.plMi}>
            {t('Ambire Gas Tank')}
          </Text>
        </View>
        <Text style={spacings.mbSm} fontSize={12} weight="regular">
          {t(
            'The Ambire Gas Tank is your special account for paying gas and saving on gas fees. By filling up your Gas Tank, you are setting aside, or prepaying for network fees. You can add more tokens to your Gas Tank at any time.'
          )}
        </Text>
        <Text fontSize={12} weight="regular">
          {t('Please note that only the listed tokens are eligible for filling up your gas tank.')}
        </Text>
      </BottomSheet>
    </GradientBackgroundWrapper>
  )
}

export default GasTankScreen
