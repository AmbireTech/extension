import React, { useMemo } from 'react'

import { SupportedNetworks } from '@ambire-common/interfaces/network'
import { SwapAndBridgeToToken } from '@ambire-common/interfaces/swapAndBridge'
import { getIsTokenEligibleForSwapAndBridge } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import { getTokenId } from '@common/utils/token'

import { createFormattedTokenDetailsReader } from './formattedTokenDetails'
import TokenSelectOptionLabel from './TokenSelectOptionLabel'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import type { TokenResult } from '@ambire-common/libs/portfolio'

const TextFallbackState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text fontSize={14} appearance="secondaryText" style={spacings.plTy}>
    {children}
  </Text>
)

const getTokenOptionsEmptyState = (isToToken = false) => [
  {
    value: 'noTokens',
    label: (
      <TextFallbackState>
        {isToToken ? 'Failed to retrieve tokens' : 'No tokens found'}
      </TextFallbackState>
    ),
    icon: null
  }
]

const LOADING_TOKEN_ITEMS = [
  {
    value: 'loading',
    label: <TextFallbackState>Loading tokens...</TextFallbackState>,
    icon: null
  }
]

const NO_VALUE_SELECTED = [
  {
    value: 'no-selection',
    label: <TextFallbackState>Select a token</TextFallbackState>,
    icon: null
  }
]

const EMPTY_PORTFOLIO_TOKENS: TokenResult[] = []

const selectPortfolioTokens = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.tokens

const selectNetworkSimulatedAccountOp = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.portfolio.networkSimulatedAccountOp

/** Both a `SwapAndBridgeToToken`'s number and a `TokenResult`'s bigint chain id key to this. */
const chainIdKey = (chainId: bigint | number) => chainId.toString()

const portfolioTokenKey = (address: string, chainId: bigint | number) =>
  `${address}-${chainIdKey(chainId)}`

const useGetTokenSelectProps = ({
  tokens,
  token,
  networks,
  isLoading,
  isToToken: _isToToken = false
}: {
  tokens: (SwapAndBridgeToToken | TokenResult)[]
  token: string
  networks: SupportedNetworks[]
  isLoading?: boolean
  isToToken?: boolean
}) => {
  const { state: portfolioTokens } = useController(
    'SelectedAccountController',
    selectPortfolioTokens
  )
  const { state: networkSimulatedAccountOp } = useController(
    'SelectedAccountController',
    selectNetworkSimulatedAccountOp
  )

  // Only the "to" list looks tokens up in the portfolio, so the "from" list - which
  // holds every token of the account - must not rebuild all of its options whenever a
  // portfolio refresh lands.
  const portfolioTokensToIndex = _isToToken ? portfolioTokens : EMPTY_PORTFOLIO_TOKENS

  return useMemo(() => {
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

    // Indexed once per build instead of scanned per token. Both of these used to be an
    // `Array.prototype.find` inside the per-token callback, which is what made building
    // the options quadratic in the size of a list that runs to thousands of tokens.
    const networkByChainId = new Map<string, SupportedNetworks>()
    networks.forEach((network) => {
      const key = chainIdKey(network.chainId)
      // First one wins, matching the `find` this replaces.
      if (networkByChainId.has(key)) return

      networkByChainId.set(key, network)
    })

    // Only the "to" token list looks tokens up in the portfolio, and eligibility is
    // decided while indexing so it is answered once per portfolio token rather than
    // once per comparison.
    const eligiblePortfolioTokenByKey = new Map<string, TokenResult>()
    if (_isToToken)
      portfolioTokensToIndex.forEach((portfolioToken) => {
        if (!getIsTokenEligibleForSwapAndBridge(portfolioToken)) return

        const key = portfolioTokenKey(portfolioToken.address, portfolioToken.chainId)
        if (eligiblePortfolioTokenByKey.has(key)) return

        eligiblePortfolioTokenByKey.set(key, portfolioToken)
      })

    /** Type guard to ensure TypeScript correctly infers the type of a token after a conditional check */
    const getIsToTokenTypeGuard = (
      tk: SwapAndBridgeToToken | TokenResult
    ): tk is SwapAndBridgeToToken => _isToToken

    const buildOption = (
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

      const network = networkByChainId.get(chainIdKey(currentToken.chainId))
      const simulatedAccountOp = networkSimulatedAccountOp[currentToken.chainId.toString() || '']
      const tokenInPortfolio = getIsToTokenTypeGuard(currentToken)
        ? eligiblePortfolioTokenByKey.get(
            portfolioTokenKey(currentToken.address, currentToken.chainId)
          )
        : currentToken

      const networkName = network?.name || (tokenInPortfolio?.flags.onGasTank ? 'Gas Tank' : '')

      // The "to" list holds tokens that are not in the portfolio and have nothing to
      // format, which is what the original code expressed by skipping the call.
      const getFormattedDetails = createFormattedTokenDetailsReader(
        getIsToTokenTypeGuard(currentToken) ? tokenInPortfolio : currentToken,
        networks,
        simulatedAccountOp
      )

      // Only the closed select's value is read for these, and they are formatted eagerly
      // rather than behind a getter: the list is handed to an `Animated` component, and
      // its deep prop walk reads every property of every option - which turned a lazy
      // getter into formatting the balances of the whole token list.
      const selectedBalances = isSelected
        ? {
            isPending: getFormattedDetails().isPending ?? false,
            pendingBalanceFormatted: getFormattedDetails().pendingBalanceFormatted || '0',
            balanceFormatted: getFormattedDetails().balanceFormatted || '0'
          }
        : undefined

      return {
        value: getTokenId(currentToken),
        address: currentToken.address,
        chainId: currentToken.chainId,
        disabled: network?.isNotSupported,
        extraSearchProps: {
          symbol,
          name,
          address: currentToken.address,
          networkName: network?.name
        },
        ...selectedBalances,
        symbol,
        label: (
          <TokenSelectOptionLabel
            currentToken={currentToken}
            symbol={symbol}
            name={name}
            network={network}
            networkName={networkName}
            tokenInPortfolio={tokenInPortfolio}
            isToToken={_isToToken}
            isSelected={isSelected}
            getFormattedDetails={getFormattedDetails}
          />
        ),
        icon: (
          <TokenIcon
            key={`${currentToken.chainId}-${currentToken.address}`}
            containerHeight={isSelected ? 28 : 32}
            containerWidth={isSelected ? 28 : 32}
            width={isSelected ? 24 : 28}
            height={isSelected ? 24 : 28}
            networkSize={isSelected ? 12 : 14}
            withContainer
            withNetworkIcon={!_isToToken}
            uri={getIsToTokenTypeGuard(currentToken) ? currentToken.icon : undefined}
            address={currentToken.address}
            chainId={BigInt(currentToken.chainId)}
          />
        )
      }
    }

    const options = tokens.map((tk) => buildOption(tk, false))
    const selectedToken = tokens.find((tk) => getTokenId(tk) === token)

    return {
      options,
      value: selectedToken ? buildOption(selectedToken, true) : NO_VALUE_SELECTED[0],
      amountSelectDisabled: false
    }
  }, [
    tokens,
    token,
    networks,
    isLoading,
    _isToToken,
    portfolioTokensToIndex,
    networkSimulatedAccountOp
  ])
}

export default useGetTokenSelectProps
