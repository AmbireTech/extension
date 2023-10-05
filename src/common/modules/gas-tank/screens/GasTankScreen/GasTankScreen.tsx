import useGasTankData from 'ambire-common/src/hooks/useGasTankData'
import { formatFloatTokenAmount } from 'ambire-common/src/services/formatter'
import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import GasTankIcon from '@common/assets/svg/GasTankIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
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
import GasTankTotalSave from '@common/modules/gas-tank/components/GasTankTotalSave'
import TokensList from '@common/modules/gas-tank/components/TokensList'
import TransactionHistoryList from '@common/modules/gas-tank/components/TransactionsHistoryList'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

import TokensListItem from '../../components/TokensList/TokensListItem'

const relayerURL = CONFIG.RELAYER_URL

const GasTankScreen = () => {
  const { t } = useTranslation()

  const { isCurrNetworkBalanceLoading } = usePortfolio()
  const { network } = useNetwork()
  const { selectedAcc } = useAccounts()
  const { addRequest } = useRequests()
  const { addToast } = useToast()
  const portfolio = usePortfolio()

  const {
    ref: sheetRefInfo,
    open: openBottomSheetInfo,
    close: closeBottomSheetInfo
  } = useModalize()
  const {
    ref: sheetRefTopUp,
    open: openBottomSheetTopUp,
    close: closeBottomSheetTopUp
  } = useModalize()

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
          {t('The Ambire Gas Tank is your special account for paying gas and saving on gas fees. ')}
          <Text color={colors.heliotrope} fontSize={12} onPress={openBottomSheetInfo}>{`${t(
            'Learn more.'
          )}`}</Text>
        </Text>
        <Panel>
          <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mb]}>
            <GasTankBalance
              onPress={openBottomSheetTopUp}
              totalBalance={
                gasTankBalances ? formatFloatTokenAmount(gasTankBalances, true, 2) : '0.00'
              }
            />
            <GasTankTotalSave
              totalSave={totalSaved || '0.00'}
              totalCashBack={totalCashBack || '0.00'}
              networkName={network?.name}
            />
          </View>
          {!!(balancesRes && balancesRes.length) && (
            <>
              <Text style={spacings.mbSm}>{t('Gas tank balance by tokens')}</Text>
              {balancesRes
                ?.sort((a: any, b: any) => b.balance - a.balance)
                ?.map((token: any, i: number) => (
                  <TokensListItem
                    // eslint-disable-next-line react/no-array-index-key
                    key={`token-${token.address}-${i}`}
                    type="balance"
                    token={token}
                    networkId={network?.id}
                  />
                ))}
            </>
          )}
          <Button
            type="outline"
            accentColor={colors.heliotrope}
            text={t('Top Up')}
            style={spacings.mtSm}
            hasBottomSpacing={false}
            onPress={openBottomSheetTopUp}
          />
          <BottomSheet
            id="gas-tank-top-up"
            sheetRef={sheetRefTopUp}
            closeBottomSheet={closeBottomSheetTopUp}
            cancelText="Close"
          >
            <TokensList
              tokens={sortedTokens}
              isLoading={isCurrNetworkBalanceLoading}
              networkId={network?.id}
              chainId={network?.chainId}
              selectedAcc={selectedAcc}
              addRequest={addRequest}
              addToast={addToast}
              closeBottomSheetTopUp={closeBottomSheetTopUp}
            />
          </BottomSheet>
        </Panel>
        <Panel>
          <TransactionHistoryList
            gasTankFilledTxns={gasTankFilledTxns || []}
            feeAssetsRes={feeAssetsRes || []}
            explorerUrl={network?.explorerUrl || ''}
            networkId={network?.id}
            networkName={network?.name}
          />
        </Panel>
      </Wrapper>

      <BottomSheet
        id="gas-tank-info"
        sheetRef={sheetRefInfo}
        closeBottomSheet={closeBottomSheetInfo}
        cancelText="Close"
      >
        <View
          style={[
            flexboxStyles.directionRow,
            flexboxStyles.alignCenter,
            flexboxStyles.justifyCenter,
            spacings.mb,
            spacings.mtTy
          ]}
        >
          <GasTankIcon />
          <Title style={[spacings.plMi, spacings.pb0]}>{t('Ambire Gas Tank')}</Title>
        </View>
        <Text style={spacings.mbSm} weight="regular">
          {t(
            'The Ambire Gas Tank is your special account for paying gas and saving on gas fees. By filling up your Gas Tank, you are setting aside, or prepaying for network fees. You can add more tokens to your Gas Tank at any time.'
          )}
        </Text>
        <Text weight="regular" style={spacings.mb}>
          {t('Please note that only the listed tokens are eligible for filling up your gas tank.')}
        </Text>
      </BottomSheet>
    </GradientBackgroundWrapper>
  )
}

export default GasTankScreen
