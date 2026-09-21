import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { ZeroAddress } from 'ethers'

import { SupportedNetworks } from '@ambire-common/interfaces/network'
import { SwapAndBridgeToToken } from '@ambire-common/interfaces/swapAndBridge'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import BatchIcon from '@common/assets/svg/BatchIcon'
import PendingToBeConfirmedIcon from '@common/assets/svg/PendingToBeConfirmedIcon'
import CopyText from '@common/components/CopyText'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import PendingBadge from '@common/modules/dashboard/components/Tokens/TokenItem/PendingBadge'
import NotSupportedNetworkTooltip from '@common/modules/swap-and-bridge/components/NotSupportedNetworkTooltip'
import { TokenExchanges } from '@common/modules/swap-and-bridge/components/ToToken/TokenExchanges'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { TokenResult } from '@ambire-common/libs/portfolio'
import type { FormattedTokenDetails } from './formattedTokenDetails'

export type TokenSelectOptionLabelProps = {
  currentToken: SwapAndBridgeToToken | TokenResult
  symbol: string
  name: string
  network?: SupportedNetworks
  networkName: string
  tokenInPortfolio?: TokenResult
  isToToken: boolean
  isSelected: boolean
  /**
   * Reads the formatted balances of `tokenInPortfolio`. Deliberately a function
   * rather than the values themselves, so the formatting only runs for the options
   * the list actually mounts.
   */
  getFormattedDetails: () => FormattedTokenDetails
}

/**
 * One row of a token Select, both in the menu and as the closed select's value.
 *
 * Memoized and handed the token rather than a finished element tree, because the
 * lists it renders run to thousands of tokens while the menu only ever mounts the
 * handful of rows on screen.
 */
const TokenSelectOptionLabel = React.memo(
  ({
    currentToken,
    symbol,
    name,
    network,
    networkName,
    tokenInPortfolio,
    isToToken,
    isSelected,
    getFormattedDetails
  }: TokenSelectOptionLabelProps) => {
    const { t } = useTranslation()
    const { theme } = useTheme()

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
    } = getFormattedDetails()

    const tooltipIdNotSupported = `token-${currentToken.address}-on-network-${currentToken.chainId}-not-supported-tooltip`
    const tooltipIdPendingBalance = `token-${currentToken.address}-on-network-${currentToken.chainId}-pending-balance`
    const isNative = currentToken.address === ZeroAddress

    const formattedBalancesLabel = !!tokenInPortfolio && (
      <View
        dataSet={isPending ? { tooltipId: tooltipIdPendingBalance } : undefined}
        style={[flexbox.alignEnd, spacings.mlSm]}
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
                  backgroundColor={theme.infoBackground}
                  textColor={theme.infoText}
                  Icon={PendingToBeConfirmedIcon}
                />
              )}
            </View>
          </Tooltip>
        )}
      </View>
    )

    const isNameDifferentThanSymbol = !!name && name.toLowerCase() !== symbol.toLowerCase()

    if (isToToken)
      return (
        <>
          <View
            dataSet={tooltipIdNotSupported ? { tooltipId: tooltipIdNotSupported } : undefined}
            style={[flexbox.flex1]}
          >
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              {/* Shrinks instead of growing, so that the exchanges sit right next to the
              symbol rather than being pushed to the far end of the row */}
              <Text
                fontSize={isMobile ? 14 : 16}
                weight="medium"
                numberOfLines={1}
                style={{ lineHeight: 20, flexShrink: 1 }}
                dataSet={
                  // Displaying the name of the token is confusing for native tokens. Example
                  // ETH (Ethereum) may confuse the user that the ETH is on Ethereum.
                  isNameDifferentThanSymbol && !isNative
                    ? createGlobalTooltipDataSet({
                        id: `token-${currentToken.chainId}-${currentToken.address}-name`,
                        content: name
                      })
                    : undefined
                }
              >
                {symbol}
              </Text>
              {/* The tokens in the current account are represented by their balance instead */}
              {!isSelected && !tokenInPortfolio && (
                <TokenExchanges
                  chainId={Number(currentToken.chainId)}
                  address={currentToken.address}
                />
              )}
            </View>
            {isNative ? (
              <Text
                numberOfLines={1}
                fontSize={12}
                appearance="secondaryText"
                weight="mono_regular"
              >
                Native
              </Text>
            ) : (
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                <Text
                  numberOfLines={1}
                  fontSize={12}
                  appearance="secondaryText"
                  weight="mono_regular"
                  {...(isMobile ? { ellipsizeMode: 'middle' } : {})}
                >
                  {shortenAddress(currentToken.address, 13)}
                </Text>
                {!isSelected && (
                  <CopyText
                    text={currentToken.address}
                    iconSize={14}
                    iconColor={theme.secondaryText}
                    style={spacings.mlMi}
                  />
                )}
              </View>
            )}
          </View>

          {!isSelected && formattedBalancesLabel}
          {network?.isNotSupported && (
            <NotSupportedNetworkTooltip
              tooltipId={tooltipIdNotSupported}
              message={network.notSupportedReason || t('Network unavailable')}
            />
          )}
        </>
      )

    return (
      <>
        <View
          style={[
            flexbox.flex1,
            !isSelected && flexbox.directionRow,
            !isSelected && flexbox.alignEnd
          ]}
        >
          <Text
            fontSize={isSelected && isMobile ? 14 : 16}
            weight="semiBold"
            style={{ lineHeight: 20 }}
            numberOfLines={1}
            dataSet={{ tooltipId: tooltipIdNotSupported }}
          >
            {symbol}
          </Text>
          {!!networkName && (
            <Text
              fontSize={isSelected ? 12 : 14}
              weight={isSelected ? 'regular' : 'medium'}
              appearance="secondaryText"
              ellipsizeMode="tail"
              numberOfLines={1}
              style={!isSelected && spacings.mlTy}
            >
              {`${isSelected ? '' : ' '}on ${networkName}`}
            </Text>
          )}
        </View>
        {!isSelected && formattedBalancesLabel}
        {network?.isNotSupported && (
          <NotSupportedNetworkTooltip
            tooltipId={tooltipIdNotSupported}
            message={network?.notSupportedReason || t('Network unavailable')}
          />
        )}
      </>
    )
  }
)

TokenSelectOptionLabel.displayName = 'TokenSelectOptionLabel'

export default TokenSelectOptionLabel
