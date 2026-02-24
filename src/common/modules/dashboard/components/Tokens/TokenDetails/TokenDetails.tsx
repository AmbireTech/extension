import { getAddress } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { getCoinGeckoTokenApiUrl, getCoinGeckoTokenUrl } from '@ambire-common/consts/coingecko'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import { getIsNetworkSupported } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import InfoIcon from '@common/assets/svg/InfoIcon'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import TopUpIcon from '@common/assets/svg/TopUpIcon'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useController from '@common/hooks/useController'
import useHasGasTank from '@common/hooks/useHasGasTank'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { storage } from '@common/services/storage'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { createTab } from '@common/utils/links'
import { getTokenId } from '@common/utils/token'
import { RELAYER_URL } from '@env'

import TokenDetailsButton from './Button'
import HideTokenModal from './HideTokenModal'
import getStyles from './styles'

const TokenDetails = ({
  token,
  handleClose
}: {
  token: TokenResult | null
  handleClose: () => void
}) => {
  const { styles, theme } = useTheme(getStyles)
  const { navigate } = useNavigation()
  const {
    ref: hideTokenModalRef,
    open: openHideTokenModal,
    close: closeHideTokenModal
  } = useModalize()
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { state: account } = useController('SelectedAccountController', (state) => state.account)
  const { state: supportedChainIds } = useController(
    'SwapAndBridgeController',
    (state) => state.supportedChainIds
  )
  const { dispatch: portfolioDispatch } = useController('PortfolioController')
  const { state: networks } = useController('NetworksController', (state) => state.networks)
  const [coinGeckoTokenSlug, setCoinGeckoTokenSlug] = useState('')
  const [isTokenInfoLoading, setIsTokenInfoLoading] = useState(false)
  const [doNotDisplayHideTokenModal, setDoNotDisplayHideTokenModal] = useState(false)
  const [gasTankAssets, setGasTankAssets] = useState<{ chainId: number; address: string }[] | null>(
    null
  )
  const [gasTankAssetsError, setGasTankAssetsError] = useState<string | null>(null)
  const network = useMemo(
    () => networks.find((n) => n.chainId === token?.chainId),
    [networks, token?.chainId]
  )

  // if the token is a gas tank token, all actions except
  // top up and maybe token info should be disabled
  const isGasTankToken = !!token?.flags.onGasTank
  const isRewardsToken = !!token?.flags.rewardsType
  const isGasTankOrRewardsToken = isGasTankToken || isRewardsToken
  const isAmountZero = token && getTokenAmount(token) === 0n
  const canToToppedUp = token?.flags.canTopUpGasTank
  const tokenId = token ? getTokenId(token) : ''
  const isNetworkNotSupportedForSwapAndBridge = !getIsNetworkSupported(supportedChainIds, network)
  const shouldDisableSwapAndBridge =
    isNetworkNotSupportedForSwapAndBridge || isGasTankOrRewardsToken || isAmountZero

  const { hasGasTank } = useHasGasTank({ account })

  const unavailableBecauseGasTankOrRewardsTokenTooltipText = t(
    'Unavailable. {{tokenType}} tokens cannot be sent, swapped, or bridged.',
    {
      tokenType: isGasTankToken ? t('Gas Tank') : t('Reward')
    }
  )
  // TODO: Temporarily moved to the "Deposit" place as of v4.49.0, due to aesthetic reasons solely.
  // const notImplementedYetTooltipText = t('Coming sometime in {{year}}.', {
  //   year: new Date().getFullYear()
  // })

  useEffect(() => {
    storage
      .get('doNotShowAgainModalHideToken', false)
      .then(setDoNotDisplayHideTokenModal)
      .catch(() => console.error('Failed to load storage value for doNotShowAgainModalHideToken'))
  }, [setDoNotDisplayHideTokenModal])

  useEffect(() => {
    // Fetch gas tank assets
    fetch(`${RELAYER_URL}/gas-tank/assets`)
      .then((r) => r.json())
      .then((assets) => {
        setGasTankAssets(assets)
        setGasTankAssetsError(null)
      })
      .catch(() => {
        setGasTankAssetsError(
          t(
            'Unable to top up right now. This might be a temporary service issue. Please try again later.'
          )
        )
        setGasTankAssets(null)
      })
  }, [t])

  const actions = useMemo(
    () => [
      {
        id: 'send',
        text: t('Send'),
        icon: SendIcon,
        onPress: ({ chainId, address }: TokenResult) =>
          navigate(`${WEB_ROUTES.transfer}?chainId=${chainId}&address=${address}`),
        isDisabled: isGasTankOrRewardsToken || isAmountZero,
        tooltipText: isGasTankOrRewardsToken
          ? unavailableBecauseGasTankOrRewardsTokenTooltipText
          : undefined,
        strokeWidth: 1.5,
        testID: 'token-send'
      },
      {
        id: 'swap-or-bridge',
        text: t('Swap or Bridge'),
        icon: SwapAndBridgeIcon,
        iconWidth: 86,
        onPress: ({ chainId, address }: TokenResult) =>
          navigate(WEB_ROUTES.swapAndBridge, {
            state: {
              preselectedFromToken: {
                address,
                chainId
              }
            }
          }),
        isDisabled: shouldDisableSwapAndBridge,
        tooltipText: isNetworkNotSupportedForSwapAndBridge
          ? t(
              'Unavailable. {{network}} network is not supported by our Swap & Bridge service provider.',
              { network: network?.name || t('This') }
            )
          : isGasTankOrRewardsToken
            ? unavailableBecauseGasTankOrRewardsTokenTooltipText
            : undefined,
        strokeWidth: 1.5
      },
      // TODO: Temporarily hidden as of v4.49.0, because displaying it disabled
      // causes confusion. It's planned to be displayed again when the feature is implemented.
      // {
      //   id: 'deposit',
      //   text: t('Deposit'),
      //   icon: DepositIcon,
      //   onPress: () => {},
      //   isDisabled: true,
      //   strokeWidth: 1
      // },
      // TODO: Temporarily moved to the "Deposit" place as of v4.49.0, due to aesthetic reasons solely.
      // Note: Earn is not implemented yet, so it is disabled.
      // {
      //   id: 'earn',
      //   text: t('Earn'),
      //   icon: EarnIcon,
      //   onPress: () => {},
      //   isDisabled: true,
      //   tooltipText: notImplementedYetTooltipText,
      //   strokeWidth: 1
      // },
      {
        id: 'top-up',
        text: t('Top up gas tank'),
        icon: TopUpIcon,
        onPress: async ({ chainId, address }: TokenResult) => {
          if (!gasTankAssets || gasTankAssetsError) return

          const canTopUp = gasTankAssets.find(
            (a) =>
              getAddress(a.address) === getAddress(address) &&
              a.chainId.toString() === chainId.toString()
          )
          if (canTopUp) navigate(`${WEB_ROUTES.topUpGasTank}?chainId=${chainId}&address=${address}`)
          else addToast('We have disabled top ups with this token.', { type: 'error' })
        },
        isDisabled: !canToToppedUp || !hasGasTank,
        tooltipText: !hasGasTank
          ? t(`Not available for ${account?.safeCreation ? 'safe' : 'hardware'} wallets, yet.`)
          : !canToToppedUp
            ? t(
                'This token is not eligible for filling up the Gas Tank. Please select a supported token instead.'
              )
            : gasTankAssetsError || undefined,
        strokeWidth: 1,
        testID: 'top-up-button'
      },
      // Note: Withdraw is not implemented yet, so it is disabled.
      // {
      //   id: 'withdraw',
      //   text: t('Withdraw'),
      //   icon: WithdrawIcon,
      //   onPress: () => {},
      //   isDisabled: true,
      //   tooltipText: isGasTankToken
      //     ? t('Gas Tank deposits cannot be withdrawn.')
      //     : notImplementedYetTooltipText,
      //   strokeWidth: 1
      // },
      {
        id: 'info',
        text: t('Token Info'),
        icon: InfoIcon,
        onPress: async () => {
          if (!coinGeckoTokenSlug || !token || !networks.length) return

          if (!network) {
            addToast(t('Network not found'), { type: 'error' })
            return
          }

          try {
            await createTab(getCoinGeckoTokenUrl(coinGeckoTokenSlug))
            handleClose()
          } catch {
            addToast(t('Could not open token info'), { type: 'error' })
          }
        },
        isDisabled: !coinGeckoTokenSlug,
        tooltipText:
          !coinGeckoTokenSlug && !isTokenInfoLoading
            ? t('No data found for this token on CoinGecko.')
            : undefined
      }
    ],
    [
      t,
      isGasTankOrRewardsToken,
      isAmountZero,
      canToToppedUp,
      coinGeckoTokenSlug,
      navigate,
      networks,
      addToast,
      token,
      handleClose,
      network,
      shouldDisableSwapAndBridge,
      isNetworkNotSupportedForSwapAndBridge,
      unavailableBecauseGasTankOrRewardsTokenTooltipText,
      isTokenInfoLoading,
      hasGasTank,
      gasTankAssets,
      gasTankAssetsError
    ]
  )
  useEffect(() => {
    if (!token?.address || !token?.chainId || !networks.length) return

    setIsTokenInfoLoading(true)

    if (!network) {
      addToast(t('Network not found'), { type: 'error' })
      setIsTokenInfoLoading(false)
      return
    }

    const tokenAddr = token.address
    const geckoChainId = network.platformId
    const geckoNativeCoinId = network.nativeAssetId
    const tokenInfoUrl = getCoinGeckoTokenApiUrl({ tokenAddr, geckoChainId, geckoNativeCoinId })
    fetch(tokenInfoUrl)
      .then((response) => response.json())
      .then((result) => setCoinGeckoTokenSlug(result.web_slug))
      .finally(() => setIsTokenInfoLoading(false))
  }, [t, token?.address, token?.chainId, networks, addToast, network])

  if (!token) return null

  const {
    flags: { onGasTank },
    chainId,
    symbol,
    address
  } = token

  const {
    priceUSDFormatted,
    balanceUSDFormatted,
    isRewards,
    isVesting,
    isProjectedRewards,
    balanceFormatted
  } = getAndFormatTokenDetails(token, networks)

  const hideToken = useCallback(() => {
    if (!token) return
    portfolioDispatch({
      type: 'method',
      params: {
        method: 'toggleHideToken',
        args: [
          {
            address: token.address,
            chainId: token.chainId
          },
          account?.addr,
          true
        ]
      }
    })
  }, [portfolioDispatch, token, account?.addr])

  const handleHideTokenFromButton = useCallback(async () => {
    if (doNotDisplayHideTokenModal) hideToken()
    else openHideTokenModal()
  }, [hideToken, openHideTokenModal, doNotDisplayHideTokenModal])

  const handleHideTokenFromModal = useCallback(
    async (doNotShowModalAnymore: boolean) => {
      storage
        .set('doNotShowAgainModalHideToken', doNotShowModalAnymore)
        .catch(() => console.error('Failed to record value for doNotShowAgainModalHideToken'))
      setDoNotDisplayHideTokenModal(doNotShowModalAnymore)
      hideToken()
      closeHideTokenModal()
      handleClose()
    },
    [hideToken, closeHideTokenModal, handleClose]
  )
  return (
    <View>
      <ModalHeader title={t('Token information')} handleClose={handleClose} />
      <HideTokenModal
        modalRef={hideTokenModalRef}
        handleClose={closeHideTokenModal}
        handleHideToken={handleHideTokenFromModal}
      />
      <View style={styles.tokenInfoAndIcon}>
        <TokenIcon
          containerHeight={40}
          containerWidth={40}
          width={36}
          height={36}
          networkSize={14}
          withContainer
          address={address}
          onGasTank={onGasTank}
          chainId={chainId}
        />
        <View style={styles.tokenInfo}>
          <View style={styles.tokenSymbolAndNetwork}>
            <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbMi]}>
              <Text selectable weight="semiBold" style={spacings.mrSm}>
                {balanceFormatted} {symbol}
              </Text>
              <Text fontSize={12} weight="medium">
                {isRewards && t('Claimable rewards')}
              </Text>
              <Text fontSize={12} weight="medium">
                {isVesting && t('Claimable early supporters vesting')}
              </Text>
            </View>
          </View>
          <View style={styles.balance}>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <Text
                selectable
                style={spacings.mrTy}
                fontSize={14}
                weight="number_medium"
                appearance="secondaryText"
              >
                {balanceUSDFormatted}
              </Text>
              <Text selectable fontSize={14} weight="number_medium" appearance="secondaryText">
                (1 ${symbol} ≈ {priceUSDFormatted})
              </Text>
            </View>
          </View>
          {!!onGasTank && (
            <View style={styles.balance}>
              <Text
                style={spacings.mtMi}
                color={theme.errorDecorative}
                fontSize={12}
                weight="number_regular"
                numberOfLines={1}
              >
                (This token is a gas tank one and therefore actions are limited)
              </Text>
            </View>
          )}
        </View>
        {!onGasTank && !isRewards && !isVesting && !isProjectedRewards && (
          <Button
            type="tertiary"
            onPress={handleHideTokenFromButton}
            testID="hide-token-button"
            text={t('Hide token')}
            size="smaller"
            style={{ height: 40, borderRadius: 20 }}
            childrenPosition="left"
          >
            <InvisibilityIcon
              width={20}
              height={20}
              color={theme.iconPrimary}
              style={spacings.mrMi}
            />
          </Button>
        )}
      </View>

      <GlassView style={{ borderRadius: 28 }} cssStyle={{ borderRadius: 28 }}>
        <View style={styles.actionsContainer}>
          {actions.map((action) => (
            <TokenDetailsButton
              key={action.id}
              {...action}
              isDisabled={!!action.isDisabled}
              token={token}
              isTokenInfoLoading={isTokenInfoLoading}
              handleClose={handleClose}
              iconWidth={action.iconWidth}
            />
          ))}
        </View>
      </GlassView>
    </View>
  )
}

export default React.memo(TokenDetails)
