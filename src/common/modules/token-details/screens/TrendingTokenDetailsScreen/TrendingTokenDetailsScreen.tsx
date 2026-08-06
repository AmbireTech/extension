import { ZeroAddress } from 'ethers'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { TrendingToken } from '@ambire-common/interfaces/dapp'
import { TokenResult } from '@ambire-common/libs/portfolio'
import OpenIcon from '@common/assets/svg/OpenIcon'
import FooterGlassView from '@common/components/FooterGlassView'
import LayoutWrapper from '@common/components/LayoutWrapper'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import Header from '@common/modules/header/components/Header/Header'
import TokenDetailsButton from '@common/modules/token-details/components/Button'
import Exchanges from '@common/modules/token-details/components/Exchanges'
import HideTokenModal from '@common/modules/token-details/components/HideTokenModal'
import TokenDetailsTitle from '@common/modules/token-details/components/Title'
import TokenBalanceCard from '@common/modules/token-details/components/TokenBalanceCard'
import TokenData from '@common/modules/token-details/components/TokenData'
import TokenPriceDisplay from '@common/modules/token-details/components/TokenPriceDisplay'
import useTokenActions from '@common/modules/token-details/hooks/useTokenActions'
import spacings, { SPACING_MI } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

/**
 * Builds a portfolio-shaped TokenResult from a trending token so the same token-details components
 * (price, balance, "About", exchanges) can render it. The trending endpoint now provides the
 * contract, chain, decimals and USD market data the portfolio components expect.
 */
const buildTokenResult = (token: TrendingToken, chainId: bigint, address: string): TokenResult => ({
  symbol: token.symbol.toUpperCase(),
  name: token.name,
  decimals: token.decimals ?? 18,
  address,
  chainId,
  amount: 0n,
  priceIn: [{ baseCurrency: 'usd', price: token.priceUSD }],
  marketDataIn: [
    {
      baseCurrency: 'usd',
      change24h: token.priceChange24hUSD ?? undefined,
      marketCap: token.marketCapUSD ?? undefined,
      totalSupply: token.totalSupply ?? undefined,
      fullyDilutedValuation: token.fullyDilutedValuationUSD ?? undefined,
      volume24h: token.totalVolumeUSD ?? undefined
    }
  ],
  meta: { exchanges: token.exchangeIds, website: token.website ?? undefined },
  flags: { onGasTank: false, rewardsType: null, canTopUpGasTank: false, isFeeToken: false }
})

const TrendingTokenDetailsScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state } = useRoute()
  const { state: dappsState } = useController('DappsController')
  const { state: networks } = useController('NetworksController', (s) => s.networks)
  const {
    state: { portfolio }
  } = useController('SelectedAccountController')

  const token: TrendingToken | undefined = useMemo(
    () =>
      (dappsState.trendingTokens || []).find(
        (tt: TrendingToken) => tt.id === state?.trendingTokenId
      ),
    [dappsState.trendingTokens, state?.trendingTokenId]
  )

  const network = useMemo(() => {
    if (!token) return undefined
    // Contract tokens carry their CoinGecko asset platform; native coins (e.g. BNB) have no
    // contract/platform, so fall back to the network whose native asset is this CoinGecko coin.
    return token.platformId
      ? networks.find((n) => n.platformId === token.platformId)
      : networks.find((n) => n.nativeAssetId === token.id)
  }, [networks, token])

  const chainId = network?.chainId ?? null

  // Native coins live at the zero address in the account portfolio.
  const tokenAddress = useMemo(() => {
    if (!token) return null
    if (token.address) return token.address
    return network?.nativeAssetId === token.id ? ZeroAddress : null
  }, [token, network])

  const portfolioToken = useMemo(() => {
    if (!tokenAddress || chainId === null) return undefined

    return portfolio.tokens.find(
      (pt) =>
        pt.address.toLowerCase() === tokenAddress.toLowerCase() &&
        pt.chainId === chainId &&
        !pt.flags.onGasTank &&
        !pt.flags.rewardsType
    )
  }, [chainId, tokenAddress, portfolio.tokens])

  // Prefer the real portfolio token (carries the account's balance) when the user holds it;
  // otherwise fall back to a synthetic result built from the trending data.
  const displayToken: TokenResult | null = useMemo(() => {
    if (!token) return null

    return portfolioToken ?? buildTokenResult(token, chainId ?? 0n, tokenAddress ?? '')
  }, [token, chainId, tokenAddress, portfolioToken])

  const formatted = useMemo(
    () => (displayToken ? getAndFormatTokenDetails(displayToken, networks) : null),
    [displayToken, networks]
  )

  const [bindCoingeckoAnim, coingeckoAnimStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.secondaryBackground, to: theme.tertiaryBackground }
  })

  const { hideTokenModalRef, closeHideTokenModal, handleHideTokenFromModal, actions } =
    useTokenActions(displayToken, {
      noBalanceSendTooltip: t("You don't hold this token, so there's nothing to send."),
      enableSwapToBuy: true,
      isNotInPortfolio: !portfolioToken
    })

  return (
    <LayoutWrapper>
      <Header.Wrapper containerStyle={isWeb ? spacings.pbMd : undefined}>
        <Header.BackButton />
        <Header.Logo />
      </Header.Wrapper>
      {!token || !displayToken || !formatted ? (
        <View style={[flexbox.flex1, flexbox.center, spacings.phSm]}>
          <Text fontSize={16} appearance="secondaryText">
            {t('Trending token not found.')}
          </Text>
        </View>
      ) : (
        <ScrollableWrapper
          // The bottom padding is because of the footer, to make sure the content is not hidden behind it.
          contentContainerStyle={[spacings.phSm, isWeb && { paddingBottom: 124 }]}
        >
          <HideTokenModal
            modalRef={hideTokenModalRef}
            handleClose={closeHideTokenModal}
            handleHideToken={handleHideTokenFromModal}
          />
          <TokenPriceDisplay
            symbol={displayToken.symbol}
            address={displayToken.address}
            chainId={displayToken.chainId}
            uri={token.icon}
            priceUSDFormatted={formatted.priceUSDFormatted}
            change24h={formatted.change24h}
            change24hFormatted={formatted.change24hFormatted}
          />
          <TokenBalanceCard
            symbol={displayToken.symbol}
            address={displayToken.address}
            chainId={displayToken.chainId}
            uri={token.icon}
            balance={formatted.balance}
            balanceFormatted={formatted.balanceFormatted}
            balanceUSDFormatted={formatted.balanceUSDFormatted}
            change24h={formatted.change24h}
            change24hFormatted={formatted.change24hFormatted}
          />
          {chainId !== null && <TokenData token={displayToken} />}
          <AnimatedPressable
            {...bindCoingeckoAnim}
            onPress={() => openInTab({ url: `https://www.coingecko.com/en/coins/${token.id}` })}
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.phSm,
              spacings.mbTy,
              { height: 56, borderRadius: BORDER_RADIUS_PRIMARY },
              coingeckoAnimStyle
            ]}
          >
            <Text fontSize={14} weight="medium" appearance="secondaryText">
              {t('CoinGecko')}
            </Text>
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.flex1,
                flexbox.justifyEnd,
                spacings.mlXl
              ]}
            >
              <Text
                fontSize={14}
                weight="medium"
                appearance="secondaryText"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {token.id}
              </Text>
              <View style={spacings.mlTy}>
                <OpenIcon />
              </View>
            </View>
          </AnimatedPressable>
          <Exchanges exchanges={displayToken.meta?.exchanges || []} />
          {!!token.description && (
            <>
              <TokenDetailsTitle title={t('Description')} />
              <View
                style={[
                  spacings.phSm,
                  spacings.pv,
                  {
                    backgroundColor: theme.secondaryBackground,
                    borderRadius: BORDER_RADIUS_PRIMARY
                  }
                ]}
              >
                <Text fontSize={14} weight="regular" appearance="secondaryText">
                  {token.description}
                </Text>
              </View>
            </>
          )}
        </ScrollableWrapper>
      )}
      {!!displayToken && (
        <FooterGlassView size="sm">
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignStart,
              isMobile && { columnGap: SPACING_MI },
              isMobile && spacings.ptTy,
              isMobile && spacings.phSm
            ]}
          >
            {actions.map((action) => (
              <TokenDetailsButton
                key={action.id}
                {...action}
                isDisabled={!!action.isDisabled}
                token={displayToken}
                iconWidth={action.iconWidth}
              />
            ))}
          </View>
        </FooterGlassView>
      )}
    </LayoutWrapper>
  )
}

export default React.memo(TrendingTokenDetailsScreen)
