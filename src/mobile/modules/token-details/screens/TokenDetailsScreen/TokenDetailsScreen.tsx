import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useTheme from '@common/hooks/useTheme'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import Header from '@common/modules/header/components/Header/Header'
import TokenDetailsButton from '@common/modules/token-details/components/Button'
import Exchanges from '@common/modules/token-details/components/Exchanges'
import HideTokenModal from '@common/modules/token-details/components/HideTokenModal'
import TokenData from '@common/modules/token-details/components/TokenData'
import TokenDetailsTransactionHistory from '@common/modules/token-details/components/TransactionHistory'
import useTokenDetails from '@common/modules/token-details/hooks/useTokenDetails'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'

import getStyles from './styles'

const TokenDetailsScreen = () => {
  const { styles, theme } = useTheme(getStyles)
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
    <MobileLayoutContainer>
      <Header.Wrapper>
        <Header.BackButton />
        <Header.Logo />
      </Header.Wrapper>
      <ScrollableWrapper contentContainerStyle={spacings.phSm}>
        <HideTokenModal
          modalRef={hideTokenModalRef}
          handleClose={closeHideTokenModal}
          handleHideToken={handleHideTokenFromModal}
        />
        <View style={styles.tokenInfoAndIcon}>
          <TokenIcon
            containerHeight={40}
            containerWidth={40}
            width={32}
            height={32}
            networkSize={16}
            withContainer
            address={address}
            onGasTank={onGasTank}
            chainId={chainId}
          />
          <View style={styles.tokenInfo}>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <Text selectable weight="semiBold" style={spacings.mrSm}>
                {symbol}
              </Text>
              <Text fontSize={12} weight="medium">
                {isRewards && t('Claimable rewards')}
              </Text>
              <Text fontSize={12} weight="medium">
                {isVesting && t('Claimable early supporters vesting')}
              </Text>
            </View>
            <Text fontSize={14} appearance="secondaryText" weight="medium">
              {balanceFormatted}
            </Text>
            {!!onGasTank && (
              <View style={styles.balance}>
                <Text
                  style={spacings.mtMi}
                  color={theme.errorDecorative}
                  fontSize={12}
                  weight="number_regular"
                  numberOfLines={1}
                >
                  {t('This token is a gas tank one and therefore actions are limited')}
                </Text>
              </View>
            )}
          </View>
          <View style={flexbox.alignEnd}>
            <Text fontSize={20} weight="number_bold">
              {balanceUSDFormatted}
            </Text>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <Text fontSize={14} weight="number_medium" appearance="secondaryText">
                {priceUSDFormatted}
              </Text>
              {typeof change24h === 'number' && (
                <Text
                  fontSize={14}
                  weight="number_medium"
                  appearance={change24h >= 0 ? 'successText' : 'errorText'}
                  style={spacings.mlMi}
                >
                  {change24hFormatted}
                </Text>
              )}
            </View>
          </View>
        </View>
        <TokenData token={token} />
        <Exchanges exchanges={token.meta?.exchanges || []} />
        <TokenDetailsTransactionHistory />
      </ScrollableWrapper>
      <View style={styles.actionsContainer}>
        {actions.map((action) => (
          <TokenDetailsButton
            key={action.id}
            {...action}
            isDisabled={!!action.isDisabled}
            token={token}
            iconWidth={action.iconWidth}
          />
        ))}
      </View>
    </MobileLayoutContainer>
  )
}

export default React.memo(TokenDetailsScreen)
