import { parseUnits } from 'ethers'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import { SvgProps } from 'react-native-svg'

import { TokenResult } from '@ambire-common/libs/portfolio'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import LogOutIcon from '@common/assets/svg/LogOutIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import FooterGlassView from '@common/components/FooterGlassView'
import LayoutWrapper from '@common/components/LayoutWrapper'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import PendingBadge from '@common/modules/dashboard/components/Tokens/TokenItem/PendingBadge'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import Header from '@common/modules/header/components/Header/Header'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import TokenDetailsButton from '@common/modules/token-details/components/Button'
import TokenBalanceCard from '@common/modules/token-details/components/TokenBalanceCard'
import TokenData from '@common/modules/token-details/components/TokenData'
import spacings, { SPACING_MI, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { privateValue } from '@common/utils/ui'
import PrivacyPoolsPoolStats from '@web/modules/privacy-pools/components/PrivacyPoolsPoolStats'
import PrivacyPoolsRagequitSheet from '@web/modules/privacy-pools/components/PrivacyPoolsRagequitSheet'
import usePrivacyPools from '@web/modules/privacy-pools/hooks/usePrivacyPools'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectSelectedType = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.selectedType
const selectIsPrivacyModeEnabled = (state: AllControllersMappingType['WalletStateController']) =>
  state.isPrivacyModeEnabled

/** The door icon, in the color of an action that cannot be undone. */
const RagequitIcon = React.memo(({ width }: SvgProps) => {
  const { theme } = useTheme()

  return <LogOutIcon width={width} height={width} color={theme.errorDecorative} />
})

/**
 * A Privacy Pools token's details, laid out like the regular token details but without the price,
 * which says nothing about the pool: the balance with the part still being verified, and only what
 * is the same for everyone holding the token (network, contract, the numbers of its pool), so
 * nothing is looked up for this account. The token is in the URL (`?chainId=&address=`), like Send.
 *
 * Send moves what is verified, privately. Rage quit takes back a deposit still being verified,
 * publicly, to the account it came from - see `PrivacyPoolsRagequitSheet`.
 */
const PrivacyPoolsTokenDetailsScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { navigate, searchParams } = useNavigation()
  const { isNarrowWebLayout } = useCompactLayout()
  const { areAllControllerStatesLoaded } = useContext(ControllersStateLoadedContext)
  const { state: selectedType } = useController('SelectedAccountController', selectSelectedType)
  const { state: isPrivacyModeEnabled } = useController(
    'WalletStateController',
    selectIsPrivacyModeEnabled
  )
  const { balances, balancesState, getTokenPrice } = usePrivacyPools()
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()
  // Reserves as much scroll space as the floating footer takes, as on the regular token details
  const [footerHeight, setFooterHeight] = useState(0)
  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    setFooterHeight(event.nativeEvent.layout.height)
  }, [])

  // From the URL, not `useRoute().params`, which is the route state whenever there is one - and
  // `navigate` always sets one
  const chainId = searchParams.get('chainId') || ''
  const tokenAddress = (searchParams.get('address') || '').toLowerCase()
  const balance = useMemo(
    () => balances.find(({ id }) => id === `${chainId}:${tokenAddress}`) || null,
    [balances, chainId, tokenAddress]
  )

  // Gone once another account is selected - as a rage quit does, switching to the account the
  // deposit came from - or once nothing of the token is left
  const shouldLeave =
    areAllControllerStatesLoaded &&
    (selectedType !== 'privacyPools' || (balancesState === 'ready' && !balance))
  useEffect(() => {
    if (shouldLeave) navigate(ROUTES.dashboard)
  }, [navigate, shouldLeave])

  const price = balance ? getTokenPrice(balance.chainId, balance.tokenAddress) : null

  // Shaped like a portfolio token for the shared token details parts. Priced by the Privacy Pools
  // controller, as the account has no portfolio, and with no market data, which would be fetched
  const token: TokenResult | null = useMemo(() => {
    if (!balance) return null

    return {
      symbol: balance.symbol,
      name: balance.symbol,
      decimals: balance.decimals,
      address: balance.tokenAddress,
      chainId: BigInt(balance.chainId),
      amount: parseUnits(balance.totalAmount, balance.decimals),
      priceIn: price === null ? [] : [{ baseCurrency: 'usd', price }],
      marketDataIn: [],
      flags: { onGasTank: false, rewardsType: null, canTopUpGasTank: false, isFeeToken: false }
    }
  }, [balance, price])
  const formatted = useMemo(() => (token ? getAndFormatTokenDetails(token) : null), [token])

  const openSend = useCallback(
    () => navigate(`${WEB_ROUTES.privacyPoolsSend}?chainId=${chainId}&address=${tokenAddress}`),
    [chainId, navigate, tokenAddress]
  )
  const openRagequit = useCallback(() => openSheet(), [openSheet])

  const canSend = !!balance && Number(balance.approvedAmount) > 0
  const canRagequit = !!balance && balance.pendingAmountRaw > 0n
  const actions = useMemo(
    () => [
      {
        id: 'send',
        text: t('Send'),
        icon: SendIcon,
        onPress: openSend,
        isDisabled: !canSend,
        tooltipText: canSend
          ? ''
          : t('Nothing is ready to send yet. Deposits can be sent once they are verified.'),
        strokeWidth: 1.5,
        testID: 'privacy-pools-token-send'
      },
      {
        id: 'ragequit',
        text: t('Rage quit'),
        icon: RagequitIcon,
        onPress: openRagequit,
        isDisabled: !canRagequit,
        tooltipText: canRagequit
          ? t('Take back a deposit that is still being verified, to the account it came from.')
          : t('All of it is verified, so use Send to move it.'),
        testID: 'privacy-pools-token-ragequit'
      }
    ],
    [canRagequit, canSend, openRagequit, openSend, t]
  )

  if (!balance || !token || !formatted) return null

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
          // In a narrow view the footer sits under the content, so no space has to be reserved for it
          !isNarrowWebLayout && {
            paddingBottom: footerHeight ? footerHeight + SPACING_SM * 2 : 124
          }
        ]}
      >
        <TokenBalanceCard
          symbol={token.symbol}
          address={token.address}
          chainId={token.chainId}
          balance={formatted.balance}
          balanceFormatted={privateValue(formatted.balanceFormatted, isPrivacyModeEnabled) ?? ''}
          balanceUSDFormatted={
            price === null
              ? ''
              : (privateValue(formatted.balanceUSDFormatted, isPrivacyModeEnabled, 8) ?? '')
          }
          change24h={formatted.change24h}
          change24hFormatted={formatted.change24hFormatted}
          containerStyle={balance.pendingAmount ? spacings.mbTy : undefined}
        />
        {/* Like the token's row: the part being verified can only be taken back, not sent */}
        {!!balance.pendingAmount && (
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbSm, spacings.phTy]}>
            <PendingBadge
              amount={balance.pendingAmountRaw}
              amountFormatted={
                privateValue(
                  formatDecimals(Number(balance.pendingAmount), 'amount'),
                  isPrivacyModeEnabled
                ) ?? ''
              }
              label="being verified"
              backgroundColor={theme.infoBackground}
              textColor={theme.infoText}
            />
            <Text
              color={theme.successText}
              weight="medium"
              fontSize={12}
              numberOfLines={1}
              style={spacings.mlSm}
            >
              {privateValue(
                formatDecimals(Number(balance.approvedAmount), 'amount'),
                isPrivacyModeEnabled
              )}{' '}
              {t('(ready to send)')}
            </Text>
          </View>
        )}
        <TokenData token={token}>
          <PrivacyPoolsPoolStats
            chainId={balance.chainId}
            tokenAddress={balance.tokenAddress}
            symbol={balance.symbol}
            decimals={balance.decimals}
            price={price}
          />
        </TokenData>
      </ScrollableWrapper>
      <FooterGlassView
        size="sm"
        // In a narrow view the footer sits under the content like on mobile, instead of floating over it
        absolute={!isNarrowWebLayout}
        fullWidth={isNarrowWebLayout}
        style={
          isNarrowWebLayout
            ? { backgroundColor: theme.primaryBackground, justifyContent: 'flex-end' }
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
            isLast={index === actions.length - 1}
            token={token}
            forceCompact={isNarrowWebLayout}
          />
        ))}
      </FooterGlassView>
      <PrivacyPoolsRagequitSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeSheet}
        chainId={balance.chainId}
        tokenAddress={balance.tokenAddress}
        symbol={balance.symbol}
        decimals={balance.decimals}
      />
    </LayoutWrapper>
  )
}

export default React.memo(PrivacyPoolsTokenDetailsScreen)
