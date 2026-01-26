import { ZeroAddress } from 'ethers'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { SwapAndBridgeToToken } from '@ambire-common/interfaces/swapAndBridge'
import { TokenResult } from '@ambire-common/libs/portfolio'
import {
  getIsNetworkSupported,
  getIsTokenEligibleForSwapAndBridge
} from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import BatchIcon from '@common/assets/svg/BatchIcon'
import PendingToBeConfirmedIcon from '@common/assets/svg/PendingToBeConfirmedIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import PendingBadge from '@common/modules/dashboard/components/Tokens/TokenItem/PendingBadge'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import NotSupportedNetworkTooltip from '@web/modules/swap-and-bridge/components/NotSupportedNetworkTooltip'
import { getTokenId } from '@web/utils/token'

const TextFallbackState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text weight="medium" fontSize={14}>
    {children}
  </Text>
)

const getTokenOptionsEmptyState = (isToToken = false) => [
  {
    value: 'noTokens',
    label: (
      <TextFallbackState>
        {isToToken ? 'Failed to retrieve tokens' : "You don't have any tokens"}
      </TextFallbackState>
    ),
    icon: null
  }
]

const LOADING_TOKEN_ITEMS = [
  {
    value: 'loading',
    label: <TextFallbackState>Fetching tokens...</TextFallbackState>,
    icon: null
  }
]

const NO_VALUE_SELECTED = [
  {
    value: 'no-selection',
    label: <TextFallbackState>Please select token</TextFallbackState>,
    icon: null
  }
]

const useGetTokenSelectProps = ({
  tokens,
  token,
  networks,
  supportedChainIds,
  isLoading,
  isToToken: _isToToken = false
}: {
  tokens: (SwapAndBridgeToToken | TokenResult)[]
  token: string
  networks: Network[]
  supportedChainIds?: Network['chainId'][]
  isLoading?: boolean
  isToToken?: boolean
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { portfolio } = useSelectedAccountControllerState()

  if (isLoading)
    return {
      options: LOADING_TOKEN_ITEMS,
      value: LOADING_TOKEN_ITEMS[0],
      amountSelectDisabled: true
    }

  if (tokens?.length === 0 && !_isToToken) {
    const noTokensEmptyState = getTokenOptionsEmptyState(_isToToken)

    return {
      options: noTokensEmptyState,
      value: noTokensEmptyState[0],
      amountSelectDisabled: true
    }
  }

  /** Type guard to ensure TypeScript correctly infers the type of a token after a conditional check */
  const getIsToTokenTypeGuard = (
    tk: SwapAndBridgeToToken | TokenResult
  ): tk is SwapAndBridgeToToken => _isToToken

  const renderItem = (
    currentToken: SwapAndBridgeToToken | TokenResult,
    isSelected: boolean = false
  ) => {
    const symbol = getIsToTokenTypeGuard(currentToken)
      ? // Overprotective on purpose here, the API does return `null` values, although it shouldn't
        currentToken.symbol?.trim() || 'No symbol'
      : currentToken.symbol

    const name = getIsToTokenTypeGuard(currentToken)
      ? // Overprotective on purpose here, the API does return `null` values, although it shouldn't
        currentToken.name?.trim() || 'No name'
      : ''
    const network = networks.find((n) =>
      getIsToTokenTypeGuard(currentToken)
        ? Number(n.chainId) === currentToken.chainId
        : n.chainId === currentToken.chainId
    )
    const tooltipIdNotSupported = `token-${currentToken.address}-on-network-${currentToken.chainId}-not-supported-tooltip`
    const tooltipIdPendingBalance = `token-${currentToken.address}-on-network-${currentToken.chainId}-pending-balance`
    const isTokenNetworkSupported = supportedChainIds
      ? getIsNetworkSupported(supportedChainIds, network)
      : true

    const simulatedAccountOp =
      portfolio.networkSimulatedAccountOp[currentToken.chainId.toString() || '']
    const tokenInPortfolio = getIsToTokenTypeGuard(currentToken)
      ? portfolio.tokens.find(
          (pt) =>
            pt.address === currentToken.address &&
            pt.chainId === BigInt(currentToken.chainId) &&
            getIsTokenEligibleForSwapAndBridge(pt)
        )
      : currentToken
    const isNative = currentToken.address === ZeroAddress

    const {
      balanceUSDFormatted = '',
      balanceFormatted = '',
      isPending = false,
      pendingToBeConfirmed = '',
      pendingToBeConfirmedFormatted = '',
      pendingToBeSigned = '',
      pendingToBeSignedFormatted = '',
      balanceLatestFormatted = '',
      pendingBalanceFormatted = '',
      pendingBalanceUSDFormatted = ''
    } = getIsToTokenTypeGuard(currentToken)
      ? tokenInPortfolio
        ? getAndFormatTokenDetails(tokenInPortfolio, networks, simulatedAccountOp)
        : {}
      : getAndFormatTokenDetails(currentToken, networks, simulatedAccountOp)

    const formattedBalancesLabel = !!tokenInPortfolio && (
      <View
        dataSet={isPending ? { tooltipId: tooltipIdPendingBalance } : undefined}
        style={flexbox.alignEnd}
      >
        <Text
          fontSize={16}
          weight="medium"
          appearance="primaryText"
          color={isPending && theme.warningText}
        >
          {isPending ? pendingBalanceUSDFormatted : balanceUSDFormatted}
        </Text>
        <Text fontSize={12} appearance="secondaryText" color={isPending && theme.warningText}>
          {isPending ? pendingBalanceFormatted : balanceFormatted}
        </Text>
        {isPending && (
          <Tooltip id={tooltipIdPendingBalance}>
            <View style={spacings.mtMi}>
              <View style={[flexbox.directionRow, spacings.mbTy]}>
                <Text
                  selectable
                  style={[spacings.mrMi, { opacity: 0.7 }]}
                  color={theme.successText}
                  fontSize={14}
                  weight="number_bold"
                  numberOfLines={1}
                >
                  {balanceLatestFormatted} {symbol} ({balanceUSDFormatted})
                </Text>
                <Text
                  selectable
                  style={{ opacity: 0.7 }}
                  color={theme.successText}
                  fontSize={12}
                  numberOfLines={1}
                >
                  {t('(Onchain)')}
                </Text>
              </View>
              {!!pendingToBeSigned && !!pendingToBeSignedFormatted && (
                <PendingBadge
                  amount={pendingToBeSigned}
                  amountFormatted={pendingToBeSignedFormatted}
                  label={t('{{symbol}} awaiting signature', { symbol })}
                  backgroundColor={theme.warningBackground}
                  textColor={theme.warningText}
                  Icon={BatchIcon}
                />
              )}
              {!!pendingToBeConfirmed && !!pendingToBeConfirmedFormatted && (
                <PendingBadge
                  amount={pendingToBeConfirmed}
                  amountFormatted={pendingToBeConfirmedFormatted}
                  label={t('confirming')}
                  backgroundColor={theme.info2Background}
                  textColor={theme.info2Text}
                  Icon={PendingToBeConfirmedIcon}
                />
              )}
            </View>
          </Tooltip>
        )}
      </View>
    )

    const isNameDifferentThanSymbol = name.toLowerCase() !== symbol.toLowerCase()
    const label = getIsToTokenTypeGuard(currentToken) ? (
      <>
        <View
          dataSet={tooltipIdNotSupported ? { tooltipId: tooltipIdNotSupported } : undefined}
          style={flexbox.flex1}
        >
          <Text numberOfLines={1}>
            <Text fontSize={16} weight="medium" numberOfLines={1}>
              {symbol}{' '}
            </Text>
            {/* Displaying the name of the token is confusing for native tokens. Example
            ETH (Ethereum) may confuse the user that the ETH is on Ethereum  */}
            {isNameDifferentThanSymbol && !isNative && (
              <Text fontSize={14} appearance="secondaryText">
                ({name})
              </Text>
            )}
          </Text>
          <Text numberOfLines={1} fontSize={12} appearance="secondaryText">
            {isNative && 'Native'}
            {!isNative && isSelected && shortenAddress(currentToken.address, 13)}
            {!isNative && !isSelected && currentToken.address}
          </Text>
        </View>

        {!isSelected && formattedBalancesLabel}
        {!isTokenNetworkSupported && (
          <NotSupportedNetworkTooltip tooltipId={tooltipIdNotSupported} network={network} />
        )}
      </>
    ) : (
      <>
        <Text
          numberOfLines={1}
          dataSet={{ tooltipId: tooltipIdNotSupported }}
          style={flexbox.flex1}
        >
          <Text fontSize={16} weight="medium">
            {symbol}
          </Text>
          <Text fontSize={14} appearance="secondaryText">
            {' on '}
          </Text>
          <Text fontSize={14} appearance="secondaryText">
            {network?.name || 'Unknown network'}
          </Text>
        </Text>
        {!isSelected && formattedBalancesLabel}
        {!isTokenNetworkSupported && (
          <NotSupportedNetworkTooltip tooltipId={tooltipIdNotSupported} network={network} />
        )}
      </>
    )

    return {
      value: getTokenId(currentToken),
      address: currentToken.address,
      chainId: currentToken.chainId,
      disabled: !isTokenNetworkSupported,
      extraSearchProps: { symbol, name, address: currentToken.address, networkName: network?.name },
      isPending,
      pendingBalanceFormatted: pendingBalanceFormatted || '0',
      balanceFormatted: balanceFormatted || '0',
      symbol,
      label,
      icon: (
        <TokenIcon
          key={`${currentToken.chainId}-${currentToken.address}`}
          containerHeight={30}
          containerWidth={30}
          networkSize={12}
          withContainer
          withNetworkIcon={!_isToToken}
          uri={getIsToTokenTypeGuard(currentToken) ? currentToken.icon : undefined}
          address={currentToken.address}
          chainId={BigInt(currentToken.chainId)}
        />
      )
    }
  }

  const options = tokens.map((tk) => renderItem(tk, false))
  const selectedToken = tokens.find((tk) => getTokenId(tk) === token)

  return {
    options,
    value: selectedToken ? renderItem(selectedToken, true) : NO_VALUE_SELECTED[0],
    amountSelectDisabled: false
  }
}

export default useGetTokenSelectProps
