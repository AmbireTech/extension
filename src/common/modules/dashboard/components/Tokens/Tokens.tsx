import { NetworkId, NetworkType } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import usePrivateMode from '@common/hooks/usePrivateMode'
import AddOrHideToken from '@common/modules/dashboard/components/AddOrHideToken'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import TokensListLoader from '../Loaders/TokensListLoader'
import Rewards from '../Rewards'
import TokenItem from './TokenItem'

interface Props {
  tokens: UsePortfolioReturnType['tokens']
  extraTokens: UsePortfolioReturnType['extraTokens']
  hiddenTokens: UsePortfolioReturnType['hiddenTokens']
  networkId?: NetworkId
  networkName?: NetworkType['name']
  selectedAcc: UseAccountsReturnType['selectedAcc']
  isCurrNetworkBalanceLoading: boolean
  onAddExtraToken: UsePortfolioReturnType['onAddExtraToken']
  onAddHiddenToken: UsePortfolioReturnType['onAddHiddenToken']
  onRemoveExtraToken: UsePortfolioReturnType['onRemoveExtraToken']
  onRemoveHiddenToken: UsePortfolioReturnType['onRemoveHiddenToken']
}

const Tokens = ({
  tokens,
  extraTokens,
  hiddenTokens,
  networkId,
  networkName,
  selectedAcc,
  isCurrNetworkBalanceLoading,
  onAddExtraToken,
  onAddHiddenToken,
  onRemoveExtraToken,
  onRemoveHiddenToken
}: Props) => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { hidePrivateValue } = usePrivateMode()
  const sortedTokens = tokens.sort((a, b) => b.balanceUSD - a.balanceUSD)

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
    () => !isCurrNetworkBalanceLoading && !tokens.length,

    [isCurrNetworkBalanceLoading, tokens?.length]
  )

  const emptyState = (
    <View style={[spacings.phLg, spacings.pvTy, spacings.mbMi, flexboxStyles.center]}>
      <Text style={[spacings.mb, textStyles.center]}>
        {t("Welcome! You don't have any funds on this network.")}
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

      {!isCurrNetworkBalanceLoading && <Rewards />}

      {!isCurrNetworkBalanceLoading &&
        !shouldShowEmptyState &&
        !!sortedTokens.length &&
        sortedTokens.map(
          (
            {
              address,
              symbol,
              img,
              tokenImageUrl,
              balance,
              balanceUSD,
              decimals,
              latest,
              pending,
              unconfirmed
            }: any,
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

      <AddOrHideToken
        tokens={sortedTokens}
        networkId={networkId}
        networkName={networkName}
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
