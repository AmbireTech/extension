import { NetworkId, NetworkType } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useCallback } from 'react'
import { Linking, View } from 'react-native'

import { useTranslation } from '@config/localization'
import Button from '@modules/common/components/Button'
import Spinner from '@modules/common/components/Spinner'
import Text from '@modules/common/components/Text'
import usePrivateMode from '@modules/common/hooks/usePrivateMode'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'
import AddOrHideToken from '@modules/dashboard/components/AddOrHideToken'
import { useNavigation } from '@react-navigation/native'

import TokenItem from './TokenItem'

interface Props {
  tokens: UsePortfolioReturnType['tokens']
  extraTokens: UsePortfolioReturnType['extraTokens']
  hiddenTokens: UsePortfolioReturnType['hiddenTokens']
  protocols: UsePortfolioReturnType['protocols']
  isLoading: boolean
  networkId?: NetworkId
  networkRpc?: NetworkType['rpc']
  networkName?: NetworkType['name']
  selectedAcc: UseAccountsReturnType['selectedAcc']
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
  isLoading,
  networkId,
  networkRpc,
  networkName,
  selectedAcc,
  onAddExtraToken,
  onAddHiddenToken,
  onRemoveExtraToken,
  onRemoveHiddenToken
}: Props) => {
  const { t } = useTranslation()
  const navigation: any = useNavigation()
  const { hidePrivateValue } = usePrivateMode()
  const sortedTokens = tokens.sort((a, b) => b.balanceUSD - a.balanceUSD)
  const otherProtocols = protocols.filter(({ label }) => label !== 'Tokens')

  const handleGoToDeposit = () => navigation.navigate('receive')
  const handleGoToSend = useCallback(
    (symbol: string) => navigation.navigate('send', { tokenAddressOrSymbol: symbol.toString() }),
    []
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
      {isLoading && (
        <View style={[flexboxStyles.center, spacings.pbLg]}>
          <Spinner />
        </View>
      )}

      {!isLoading && !sortedTokens.length && emptyState}

      {!isLoading &&
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
        networkRpc={networkRpc}
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
