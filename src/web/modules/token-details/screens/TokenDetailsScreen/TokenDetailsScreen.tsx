import React from 'react'
import { useTranslation } from 'react-i18next'

import FooterGlassView from '@common/components/FooterGlassView'
import LayoutWrapper from '@common/components/LayoutWrapper'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import Header from '@common/modules/header/components/Header/Header'
import TokenDetailsButton from '@common/modules/token-details/components/Button'
import Exchanges from '@common/modules/token-details/components/Exchanges'
import HideTokenModal from '@common/modules/token-details/components/HideTokenModal'
import TokenBalanceCard from '@common/modules/token-details/components/TokenBalanceCard'
import TokenData from '@common/modules/token-details/components/TokenData'
import TokenPriceDisplay from '@common/modules/token-details/components/TokenPriceDisplay'
import TokenDetailsTransactionHistory from '@common/modules/token-details/components/TransactionHistory'
import useTokenDetails from '@common/modules/token-details/hooks/useTokenDetails'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const TokenDetailsScreen = () => {
  const { t } = useTranslation()
  const {
    token,
    networks,
    hideTokenModalRef,
    closeHideTokenModal,
    handleHideTokenFromModal,
    actions
  } = useTokenDetails()

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
        contentContainerStyle={[flexbox.flex1, spacings.phSm, { paddingBottom: 124 }]}
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
          chainId={chainId}
          onGasTank={onGasTank}
          balanceFormatted={balanceFormatted}
          balanceUSDFormatted={balanceUSDFormatted}
          change24h={change24h}
          change24hFormatted={change24hFormatted}
          isRewards={isRewards}
          isVesting={isVesting}
        />
        <TokenData token={token} />
        <Exchanges exchanges={token.meta?.exchanges || []} />
        <TokenDetailsTransactionHistory />
      </ScrollableWrapper>
      <FooterGlassView size="sm">
        {actions.map((action) => (
          <TokenDetailsButton
            key={action.id}
            {...action}
            isDisabled={!!action.isDisabled}
            token={token}
            iconWidth={action.iconWidth}
          />
        ))}
      </FooterGlassView>
    </LayoutWrapper>
  )
}

export default React.memo(TokenDetailsScreen)
