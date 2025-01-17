import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { SwapAndBridgeToToken } from '@ambire-common/interfaces/swapAndBridge'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { getAndFormatTokenDetails } from '@ambire-common/libs/portfolio/helpers'
import {
  getIsNetworkSupported,
  getIsTokenEligibleForSwapAndBridgeToToken
} from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import CartIcon from '@common/assets/svg/CartIcon'
import PendingToBeConfirmedIcon from '@common/assets/svg/PendingToBeConfirmedIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import PendingBadge from '@common/modules/dashboard/components/Tokens/TokenItem/PendingBadge'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import NotSupportedNetworkTooltip from '@web/modules/swap-and-bridge/components/NotSupportedNetworkTooltip'
import { getTokenId } from '@web/utils/token'

const getTokenOptionsEmptyState = (isToToken = false) => [
  {
    value: 'noTokens',
    label: (
      <Text weight="medium" fontSize={14}>
        {isToToken ? 'Failed to retrieve tokens' : "You don't have any tokens"}
      </Text>
    ),
    icon: null
  }
]

const LOADING_TOKEN_ITEMS = [
  {
    value: 'loading',
    label: (
      <Text weight="medium" fontSize={14}>
        Fetching tokens...
      </Text>
    ),
    icon: null
  }
]

const NO_VALUE_SELECTED = [
  {
    value: 'no-selection',
    label: (
      <Text weight="medium" fontSize={14}>
        Please select token
      </Text>
    ),
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
  tokens: SwapAndBridgeToToken[] | TokenResult[]
  token: string
  networks: Network[]
  supportedChainIds: Network['chainId'][]
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

  if (tokens?.length === 0) {
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
        : n.id === currentToken.networkId
    )
    const tooltipIdNotSupported = `token-${currentToken.address}-on-network-${network?.chainId}-not-supported-tooltip`
    const tooltipIdPendingBalance = `token-${currentToken.address}-on-network-${network?.chainId}-pending-balance`
    const isTokenNetworkSupported = getIsNetworkSupported(supportedChainIds, network)
    const networkId = network?.id || ''
    const simulatedAccountOp = portfolio.networkSimulatedAccountOp[networkId]
    const tokenInPortfolio = getIsToTokenTypeGuard(currentToken)
      ? portfolio.tokens.find(
          (pt) =>
            pt.address === currentToken.address &&
            pt.networkId === networkId &&
            getIsTokenEligibleForSwapAndBridgeToToken(pt)
        )
      : currentToken
    const tokenAmounts = portfolio.tokenAmounts.find((tAmount) => {
      const isOnGasTank = getIsToTokenTypeGuard(currentToken)
        ? tokenInPortfolio?.flags.onGasTank ?? false // always assume false if missing in portfolio
        : currentToken.flags.onGasTank
      const rewardsType = getIsToTokenTypeGuard(currentToken)
        ? tokenInPortfolio?.flags.rewardsType ?? null
        : currentToken.flags.rewardsType

      return (
        tAmount.address === currentToken.address &&
        tAmount.networkId === networkId &&
        !isOnGasTank &&
        !rewardsType
      )
    })

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
        ? getAndFormatTokenDetails(tokenInPortfolio, networks, tokenAmounts, simulatedAccountOp)
        : {}
      : getAndFormatTokenDetails(currentToken, networks, tokenAmounts, simulatedAccountOp)

    const formattedBalancesLabel = !!tokenInPortfolio && (
      <View
        // @ts-ignore missing in the types, but React Native Web supports it
        dataSet={isPending && { tooltipId: tooltipIdPendingBalance }}
        style={flexbox.alignEnd}
      >
        <Text
          fontSize={16}
          weight="medium"
          appearance="primaryText"
          color={isPending && theme.warningText}
        >
          {isPending ? pendingBalanceFormatted : balanceUSDFormatted}
        </Text>
        <Text fontSize={12} appearance="secondaryText" color={isPending && theme.warningText}>
          {isPending ? pendingBalanceUSDFormatted : balanceFormatted}
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
                  {t('(On-chain)')}
                </Text>
              </View>
              {!!pendingToBeSigned && !!pendingToBeSignedFormatted && (
                <PendingBadge
                  amount={pendingToBeSigned}
                  amountFormatted={pendingToBeSignedFormatted}
                  label={t('{{symbol}} Pending transaction signature', { symbol })}
                  backgroundColor={colors.lightBrown}
                  textColor={theme.warningText}
                  Icon={CartIcon}
                />
              )}
              {!!pendingToBeConfirmed && !!pendingToBeConfirmedFormatted && (
                <PendingBadge
                  amount={pendingToBeConfirmed}
                  amountFormatted={pendingToBeConfirmedFormatted}
                  label={t('Pending to be confirmed')}
                  backgroundColor={colors.lightAzureBlue}
                  textColor={colors.azureBlue}
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
          // @ts-ignore missing in the types, but React Native Web supports it
          dataSet={tooltipIdNotSupported && { tooltipId: tooltipIdNotSupported }}
          style={flexbox.flex1}
        >
          <Text numberOfLines={1}>
            <Text fontSize={16} weight="medium" numberOfLines={1}>
              {symbol}{' '}
            </Text>
            {isNameDifferentThanSymbol && (
              <Text fontSize={14} appearance="secondaryText">
                ({name})
              </Text>
            )}
          </Text>
          <Text numberOfLines={1} fontSize={12} appearance="secondaryText">
            {isSelected ? shortenAddress(currentToken.address, 13) : currentToken.address}
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

    const networkIdOrChainId = getIsToTokenTypeGuard(currentToken)
      ? currentToken.chainId
      : currentToken.networkId

    return {
      value: getTokenId(currentToken),
      address: currentToken.address,
      networkId,
      disabled: !isTokenNetworkSupported,
      extraSearchProps: { symbol, name, address: currentToken.address },
      isInAccPortfolio: !!tokenInPortfolio,
      label,
      icon: (
        <TokenIcon
          key={`${networkIdOrChainId}-${currentToken.address}`}
          containerHeight={30}
          containerWidth={30}
          networkSize={12}
          withContainer
          withNetworkIcon={!_isToToken}
          uri={getIsToTokenTypeGuard(currentToken) ? currentToken.icon : undefined}
          address={currentToken.address}
          networkId={networkIdOrChainId}
        />
      )
    }
  }

  const options = tokens.map((t) => renderItem(t, false))
  const selectedToken = tokens.find((tk) => getTokenId(tk) === token)

  return {
    options,
    value: token ? renderItem(selectedToken, true) : NO_VALUE_SELECTED[0],
    amountSelectDisabled: false
  }
}

export default useGetTokenSelectProps
