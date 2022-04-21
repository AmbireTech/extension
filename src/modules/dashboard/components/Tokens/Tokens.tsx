import React from 'react'
import { Linking, TouchableOpacity, View } from 'react-native'

import MissingTokenIcon from '@assets/svg/MissingTokenIcon'
import SendIcon from '@assets/svg/SendIcon'
import { Trans, useTranslation } from '@config/localization'
import Button from '@modules/common/components/Button'
import Spinner from '@modules/common/components/Spinner'
import Text from '@modules/common/components/Text'
import TextWarning from '@modules/common/components/TextWarning'
import Title from '@modules/common/components/Title'
import TokenIcon from '@modules/common/components/TokenIcon'
import useAccounts from '@modules/common/hooks/useAccounts'
import useNetwork from '@modules/common/hooks/useNetwork'
import usePortfolio from '@modules/common/hooks/usePortfolio'
import { formatFloatTokenAmount } from '@modules/common/services/formatters'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'
import AddToken from '@modules/dashboard/components/AddToken'
import { useNavigation } from '@react-navigation/native'

import styles from './styles'

const Balances = () => {
  const { t } = useTranslation()
  const navigation: any = useNavigation()
  const { areProtocolsLoading, isBalanceLoading, protocols, tokens } = usePortfolio()
  const { selectedAcc } = useAccounts()
  const { network: selectedNetwork } = useNetwork()

  const isLoading = isBalanceLoading || areProtocolsLoading

  const sortedTokens = tokens.sort((a, b) => b.balanceUSD - a.balanceUSD)
  const otherProtocols = protocols.filter(({ label }) => label !== 'Tokens')

  const handleGoToDeposit = () => navigation.navigate('receive')
  const handleGoToSend = (symbol: string) =>
    navigation.navigate('send', { tokenAddressOrSymbol: symbol.toString() })
  const handleGoToBlockExplorer = () =>
    Linking.openURL(`${selectedNetwork?.explorerUrl}/address/${selectedAcc}`)

  const tokenItem = (
    index,
    img,
    tokenImageUrl,
    symbol,
    balance,
    balanceUSD,
    decimals,
    address,
    send = false
  ) => {
    const displayImg = img || tokenImageUrl

    return (
      <View key={`token-${address}-${index}`} style={styles.tokenItemContainer}>
        <View style={spacings.prSm}>
          <TokenIcon
            withContainer
            uri={displayImg}
            networkId={selectedNetwork?.id}
            address={address}
          />
        </View>

        <Text fontSize={16} style={[spacings.prSm, styles.tokenSymbol]} numberOfLines={2}>
          {symbol}
        </Text>

        <View style={[styles.tokenValue, flexboxStyles.flex1]}>
          <Text fontSize={16} numberOfLines={1}>
            {formatFloatTokenAmount(balance, true, decimals)}
          </Text>
          <Text style={textStyles.highlightSecondary}>${balanceUSD.toFixed(2)}</Text>
        </View>

        <View style={spacings.plSm}>
          <TouchableOpacity
            onPress={() => handleGoToSend(symbol)}
            hitSlop={{ bottom: 10, top: 10, left: 5, right: 5 }}
            style={styles.sendContainer}
          >
            <SendIcon />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

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
          ({ address, symbol, img, tokenImageUrl, balance, balanceUSD, decimals }, i) =>
            tokenItem(i, img, tokenImageUrl, symbol, balance, balanceUSD, decimals, address, true)
        )}

      {!!otherProtocols.length &&
        otherProtocols.map(({ label, assets }, i) => (
          <View key={`category-${i}`}>
            {assets.map(
              (
                { category, symbol, img, tokenImageUrl, balance, balanceUSD, decimals, address },
                i
              ) =>
                tokenItem(
                  i,
                  img,
                  tokenImageUrl,
                  symbol,
                  balance,
                  balanceUSD,
                  decimals,
                  address,
                  category !== 'claimable'
                )
            )}
          </View>
        ))}

      <AddToken />

      <TextWarning appearance="info" style={spacings.mb0}>
        <Trans>
          <Text type="caption">
            If you don't see a specific token that you own, please check the{' '}
            <Text weight="medium" type="caption" onPress={handleGoToBlockExplorer}>
              Block Explorer
            </Text>
          </Text>
        </Trans>
      </TextWarning>
    </>
  )
}

export default Balances
