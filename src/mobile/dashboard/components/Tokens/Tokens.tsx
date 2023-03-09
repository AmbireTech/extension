import { NetworkId, NetworkType } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { ROUTES } from '@common/config/Router/routesConfig'
import useNavigation from '@common/hooks/useNavigation'
import usePrivateMode from '@common/hooks/usePrivateMode'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import AddOrHideToken from '@mobile/dashboard/components/AddOrHideToken'

import TokensListLoader from '../Loaders/TokensListLoader'
import TokenItem from './TokenItem'

interface Props {
  tokens: UsePortfolioReturnType['tokens']
  extraTokens: UsePortfolioReturnType['extraTokens']
  hiddenTokens: UsePortfolioReturnType['hiddenTokens']
  protocols: UsePortfolioReturnType['protocols']
  networkId?: NetworkId
  networkName?: NetworkType['name']
  selectedAcc: UseAccountsReturnType['selectedAcc']
  isCurrNetworkBalanceLoading: boolean
  isCurrNetworkProtocolsLoading: boolean
  onAddExtraToken: UsePortfolioReturnType['onAddExtraToken']
  onAddHiddenToken: UsePortfolioReturnType['onAddHiddenToken']
  onRemoveExtraToken: UsePortfolioReturnType['onRemoveExtraToken']
  onRemoveHiddenToken: UsePortfolioReturnType['onRemoveHiddenToken']
}

const Tokens = ({
  tokens,
  extraTokens,
  hiddenTokens,
  protocols,
  networkId,
  networkName,
  selectedAcc,
  isCurrNetworkBalanceLoading,
  isCurrNetworkProtocolsLoading,
  onAddExtraToken,
  onAddHiddenToken,
  onRemoveExtraToken,
  onRemoveHiddenToken
}: Props) => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { hidePrivateValue } = usePrivateMode()
  const sortedTokens = tokens.sort((a, b) => b.balanceUSD - a.balanceUSD)
  const otherProtocols = protocols.filter(({ label }) => label !== 'Tokens')

  const handleGoToDeposit = useCallback(() => navigate(ROUTES.receive), [navigate])
  const handleGoToSend = useCallback(
    (symbol: string) =>
      navigate(ROUTES.send, {
        state: {
          tokenAddressOrSymbol: symbol.toString()
        }
      }),
    [navigate]
  )

  const shouldShowEmptyState = useMemo(
    () =>
      !isCurrNetworkBalanceLoading &&
      !tokens.length &&
      !isCurrNetworkProtocolsLoading &&
      !otherProtocols.length,
    [
      isCurrNetworkBalanceLoading,
      isCurrNetworkProtocolsLoading,
      tokens?.length,
      otherProtocols?.length
    ]
  )

  const emptyState = (
    <View style={[spacings.phLg, spacings.mbSm, flexboxStyles.center]}>
      <Text style={[spacings.mbSm, textStyles.center]}>
        {t("Welcome! You don't have any funds on this account.")}
      </Text>
      <Button
        style={{
          // So visually it matches the combined width of the Send and Receive buttons
          width: 210
        }}
        onPress={handleGoToDeposit}
        text={t('Deposit')}
      />
    </View>
  )

  return (
    <>
      {!!isCurrNetworkBalanceLoading && <TokensListLoader />}

      {!!shouldShowEmptyState && emptyState}

      {!isCurrNetworkBalanceLoading &&
        !shouldShowEmptyState &&
        !!sortedTokens.length &&
        sortedTokens.map(
          (
            { address, symbol, img, tokenImageUrl, balance, balanceUSD, decimals }: any,
            i: number
          ) => (
            <TokenItem
              key={`token-${address}-${i}`}
              img={img || tokenImageUrl}
              symbol={symbol}
              balance={balance}
              balanceUSD={balanceUSD}
              decimals={decimals}
              address={address}
              networkId={networkId}
              onPress={handleGoToSend}
              hidePrivateValue={hidePrivateValue}
            />
          )
        )}

      {!!otherProtocols.length &&
        otherProtocols.map(({ label, assets }, i) => (
          <View key={`category-${i}`}>
            {assets.map(
              (
                { symbol, img, tokenImageUrl, balance, balanceUSD, decimals, address }: any,
                i: number
              ) => (
                <TokenItem
                  key={`token-${address}-${i}`}
                  img={img || tokenImageUrl}
                  symbol={symbol}
                  balance={balance}
                  balanceUSD={balanceUSD}
                  decimals={decimals}
                  address={address}
                  networkId={networkId}
                  onPress={handleGoToSend}
                />
              )
            )}
          </View>
        ))}

      <AddOrHideToken
        tokens={tokens}
        networkId={networkId}
        networkName={networkName}
        selectedAcc={selectedAcc}
        extraTokens={extraTokens}
        hiddenTokens={hiddenTokens}
        onAddExtraToken={onAddExtraToken}
        onAddHiddenToken={onAddHiddenToken}
        onRemoveExtraToken={onRemoveExtraToken}
        onRemoveHiddenToken={onRemoveHiddenToken}
      />
    </>
  )
}

export default Tokens
