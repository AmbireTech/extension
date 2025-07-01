import { getAddress } from 'ethers'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { getCoinGeckoTokenApiUrl, getCoinGeckoTokenUrl } from '@ambire-common/consts/coingecko'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import { getIsNetworkSupported } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import EarnIcon from '@common/assets/svg/EarnIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import TopUpIcon from '@common/assets/svg/TopUpIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import WithdrawIcon from '@common/assets/svg/WithdrawIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { RELAYER_URL } from '@env'
import { createTab } from '@web/extension-services/background/webapi/tab'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useHasGasTank from '@web/hooks/useHasGasTank'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import { getTokenId } from '@web/utils/token'

import TokenDetailsButton from './Button'
import CopyTokenAddress from './CopyTokenAddress'
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
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { tokenPreferences } = usePortfolioControllerState()
  const { account } = useSelectedAccountControllerState()
  const { supportedChainIds } = useSwapAndBridgeControllerState()
  const { dispatch } = useBackgroundService()
  const { networks } = useNetworksControllerState()
  const [coinGeckoTokenSlug, setCoinGeckoTokenSlug] = useState('')
  const [isTokenInfoLoading, setIsTokenInfoLoading] = useState(false)
  const { isHidden } = tokenPreferences.find(
    ({ address, chainId }) => address === token?.address && chainId === token?.chainId
  ) || { isHidden: false }
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
  const notImplementedYetTooltipText = t('Coming sometime in {{year}}.', {
    year: new Date().getFullYear()
  })

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
              chainId: String(chainId),
              address
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
        text: t('Top Up Gas Tank'),
        icon: TopUpIcon,
        onPress: async ({ chainId, address }: TokenResult) => {
          const assets: { chainId: number; address: string }[] = await fetch(
            `${RELAYER_URL}/gas-tank/assets`
          )
            .then((r) => r.json())
            .catch(() => addToast(t('Error while fetching from relayer'), { type: 'error' }))
          const canTopUp = !!assets.find(
            (a) =>
              getAddress(a.address) === getAddress(address) &&
              a.chainId.toString() === chainId.toString()
          )
          if (canTopUp) navigate(`${WEB_ROUTES.topUpGasTank}?chainId=${chainId}&address=${address}`)
          else addToast('We have disabled top ups with this token.', { type: 'error' })
        },
        isDisabled: !canToToppedUp || !hasGasTank,
        tooltipText: !hasGasTank
          ? t('Not available for hardware wallets yet.')
          : !canToToppedUp
          ? t(
              'This token is not eligible for filling up the Gas Tank. Please select a supported token instead.'
            )
          : undefined,
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
      notImplementedYetTooltipText,
      isGasTankToken,
      isTokenInfoLoading,
      hasGasTank
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

  const handleHideToken = () => {
    if (!token) return

    dispatch({
      type: 'PORTFOLIO_CONTROLLER_TOGGLE_HIDE_TOKEN',
      params: {
        token: {
          address: token.address,
          chainId: token.chainId
        }
      }
    })
  }
  if (!token) return null

  const {
    flags: { onGasTank },
    chainId,
    symbol,
    address
  } = token

  const { priceUSDFormatted, balanceUSDFormatted, isRewards, isVesting, networkData, balance } =
    getAndFormatTokenDetails(token, networks)

  return (
    <View>
      <View style={styles.tokenInfoAndIcon}>
        <TokenIcon
          containerHeight={48}
          containerWidth={48}
          width={36}
          height={36}
          networkSize={16}
          withContainer
          address={address}
          onGasTank={onGasTank}
          chainId={chainId}
        />
        <View style={styles.tokenInfo}>
          <View style={styles.tokenSymbolAndNetwork}>
            <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
              <Text>
                <Text selectable fontSize={20} weight="semiBold" style={spacings.mrSm}>
                  {symbol}
                </Text>
                <Text fontSize={16}>{isRewards && t('Claimable rewards')}</Text>
                <Text fontSize={16}>{isVesting && t('Claimable early supporters vesting')}</Text>
                <Text fontSize={16}>{!isRewards && !isVesting && t('on ')}</Text>
                <Text fontSize={16}>{onGasTank && t('Gas Tank')}</Text>
                <Text fontSize={16}>
                  {!onGasTank && !isRewards && !isVesting && networkData?.name}
                </Text>{' '}
                <CopyTokenAddress address={address} isRewards={isRewards} isVesting={isVesting} />
              </Text>
            </View>
            {!onGasTank && !isRewards && !isVesting && !token.flags.defiTokenType && (
              <View style={[flexbox.alignSelfEnd]}>
                <Pressable
                  style={[flexbox.directionRow, flexbox.alignCenter]}
                  onPress={handleHideToken}
                >
                  <Text weight="medium" fontSize={12}>
                    {t(isHidden ? 'Show' : 'Hide')}
                  </Text>
                  {isHidden ? (
                    <InvisibilityIcon color={theme.errorDecorative} style={styles.visibilityIcon} />
                  ) : (
                    <VisibilityIcon color={theme.successDecorative} style={styles.visibilityIcon} />
                  )}
                </Pressable>
              </View>
            )}
          </View>
          <View style={styles.balance}>
            <Text
              selectable
              style={spacings.mrMi}
              fontSize={16}
              weight="number_bold"
              numberOfLines={1}
              dataSet={{ tooltipId: `${tokenId}-details-balance` }}
            >
              {String(balance)} {symbol}
            </Text>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <Text
                selectable
                style={spacings.mrMi}
                fontSize={16}
                weight="number_bold"
                appearance="infoText"
              >
                ≈ {balanceUSDFormatted}
              </Text>
              <Text selectable fontSize={16} weight="number_regular" appearance="secondaryText">
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
      </View>

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
    </View>
  )
}

export default React.memo(TokenDetails)
