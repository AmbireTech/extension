import React, { useCallback, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'

import FooterGlassView from '@common/components/FooterGlassView'
import LayoutWrapper from '@common/components/LayoutWrapper'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useTheme from '@common/hooks/useTheme'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import Header from '@common/modules/header/components/Header/Header'
import TokenDetailsButton from '@common/modules/token-details/components/Button'
import Exchanges from '@common/modules/token-details/components/Exchanges'
import HideTokenModal from '@common/modules/token-details/components/HideTokenModal'
import SwapAndBridgeFeeCard, {
  isWalletStakingToken
} from '@common/modules/token-details/components/SwapAndBridgeFeeCard'
import TokenBalanceCard from '@common/modules/token-details/components/TokenBalanceCard'
import TokenData from '@common/modules/token-details/components/TokenData'
import TokenPriceDisplay from '@common/modules/token-details/components/TokenPriceDisplay'
import TokenDetailsTransactionHistory from '@common/modules/token-details/components/TransactionHistory'
import useTokenDetails from '@common/modules/token-details/hooks/useTokenDetails'
import spacings, { SPACING_MI, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

const { isPopup } = getUiType()

const TokenDetailsScreen = () => {
  const { theme } = useTheme()
  const { isNarrowWebLayout } = useCompactLayout()
  const {
    token,
    networks,
    hideTokenModalRef,
    closeHideTokenModal,
    handleHideTokenFromModal,
    actions
  } = useTokenDetails()
  // In the popup/expanded window, 5+ actions use the small (narrower fixed-width) button
  // layout instead, so the footer keeps the same content-hugging width/margins as the
  // 4-action case rather than stretching to fill the available width.
  const shouldUseSmallActions = isPopup && actions.length > 4
  // Reserves exactly as much scroll space as the floating footer occupies, so it never
  // overlaps the content above it (the footer grows taller when it wraps more actions).
  const [footerHeight, setFooterHeight] = useState(0)
  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    setFooterHeight(event.nativeEvent.layout.height)
  }, [])

  if (!token) return null

  const {
    flags: { onGasTank },
    chainId,
    address,
    symbol
  } = token

  const {
    priceUSDFormatted,
    balanceUSDFormatted,
    change24h,
    change24hFormatted,
    isRewards,
    isVesting,
    balance,
    balanceFormatted
  } = getAndFormatTokenDetails(token, networks)

  return (
    <LayoutWrapper>
      <Header.Wrapper containerStyle={spacings.pbMd}>
        <Header.BackButton />
        <Header.Logo />
      </Header.Wrapper>
      <ScrollableWrapper
        // The bottom padding is because of the footer, to make sure the content is not hidden behind it.
        contentContainerStyle={[
          flexbox.flex1,
          spacings.phSm,
          {
            // In the compact side-panel layout the footer's own bottom: 0 + paddingBottom:
            // SPACING_SM already bakes the gap into the measured footerHeight, so adding
            // SPACING_SM again here would double-count it.
            paddingBottom: footerHeight ? footerHeight + (isNarrowWebLayout ? 0 : SPACING_SM) : 124
          }
        ]}
      >
        <HideTokenModal
          modalRef={hideTokenModalRef}
          handleClose={closeHideTokenModal}
          handleHideToken={handleHideTokenFromModal}
        />
        <TokenPriceDisplay
          symbol={symbol}
          address={address}
          chainId={chainId}
          onGasTank={onGasTank}
          priceUSDFormatted={priceUSDFormatted}
          change24h={change24h}
          change24hFormatted={change24hFormatted}
        />
        <TokenBalanceCard
          symbol={symbol}
          address={address}
          balance={balance}
          chainId={chainId}
          onGasTank={onGasTank}
          balanceFormatted={balanceFormatted}
          balanceUSDFormatted={balanceUSDFormatted}
          change24h={change24h}
          change24hFormatted={change24hFormatted}
          isRewards={isRewards}
          isVesting={isVesting}
          xWalletAmount={token.amount}
          containerStyle={isWalletStakingToken(token) ? spacings.mbTy : undefined}
        />
        <SwapAndBridgeFeeCard token={token} />
        <TokenData token={token} />
        <Exchanges exchanges={token.meta?.exchanges || []} />
        <TokenDetailsTransactionHistory />
      </ScrollableWrapper>
      <FooterGlassView
        size="sm"
        fullWidth={isNarrowWebLayout}
        // On narrow side panels the footer has no glass/blur backing (see FooterGlassView's
        // flat-footer branch), so it otherwise floats fully transparent over the scrolled
        // content. Back it with the same page background instead.
        style={
          isNarrowWebLayout
            ? {
                backgroundColor: theme.primaryBackground,
                justifyContent: 'flex-end'
              }
            : undefined
        }
        innerContainerStyle={
          isNarrowWebLayout ? { flexDirection: 'row', gap: SPACING_MI } : undefined
        }
        onLayout={handleFooterLayout}
      >
        {actions.map((action, index) => (
          <TokenDetailsButton
            key={action.id}
            {...action}
            isDisabled={!!action.isDisabled}
            isLast={index === actions.length - 1}
            token={token}
            iconWidth={action.iconWidth}
            forceCompact={isNarrowWebLayout}
            small={shouldUseSmallActions}
          />
        ))}
      </FooterGlassView>
    </LayoutWrapper>
  )
}

export default React.memo(TokenDetailsScreen)
