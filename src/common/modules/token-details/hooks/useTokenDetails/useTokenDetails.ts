import { getAddress } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import TopUpIcon from '@common/assets/svg/TopUpIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useHasGasTank from '@common/hooks/useHasGasTank'
import useNavigation from '@common/hooks/useNavigation'
import useNetworks from '@common/hooks/useNetworks'
import useRoute from '@common/hooks/useRoute'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'
import { storage } from '@common/services/storage'
import { getBridgeNetworkNotSupportedReason } from '@common/utils/supportedNetworks'
import { getTokenId } from '@common/utils/token'
import { RELAYER_URL } from '@env'

const useTokenDetails = () => {
  const { navigate } = useNavigation()
  const { state } = useRoute()
  const {
    ref: hideTokenModalRef,
    open: openHideTokenModal,
    close: closeHideTokenModal
  } = useModalize()
  const { addToast } = useToast()
  const { t } = useTranslation()
  const {
    state: { account, portfolio }
  } = useController('SelectedAccountController')
  const { state: supportedChainIds } = useController(
    'SwapAndBridgeController',
    (state) => state.supportedChainIds
  )
  const {
    dispatch: portfolioDispatch,
    state: { tokenPreferences }
  } = useController('PortfolioController')
  const networks = useNetworks({
    acc: account,
    getAdditionalNotSupportedReason: getBridgeNetworkNotSupportedReason,
    additionalFunctionParams: [supportedChainIds]
  })
  const [doNotDisplayHideTokenModal, setDoNotDisplayHideTokenModal] = useState(false)
  const [gasTankAssets, setGasTankAssets] = useState<{ chainId: number; address: string }[] | null>(
    null
  )
  const token = useMemo(() => {
    if (!state?.tokenId) return null
    return portfolio.tokens.find((t) => getTokenId(t) === state.tokenId)
  }, [portfolio, state?.tokenId])

  const [gasTankAssetsError, setGasTankAssetsError] = useState<string | null>(null)
  const network = useMemo(
    () => networks.find((n) => n.chainId === token?.chainId),
    [networks, token?.chainId]
  )

  const isHidden = tokenPreferences.find(
    (tp) => tp.chainId === token?.chainId && tp.address === token?.address
  )?.isHidden
  // if the token is a gas tank token, all actions except
  // top up and maybe token info should be disabled
  const isGasTankToken = !!token?.flags.onGasTank
  const isRewardsToken = !!token?.flags.rewardsType
  const isGasTankOrRewardsToken = isGasTankToken || isRewardsToken
  const isAmountZero = token && getTokenAmount(token) === 0n
  const canToToppedUp = token?.flags.canTopUpGasTank
  const shouldDisableSwapAndBridge =
    network?.isNotSupported || isGasTankOrRewardsToken || isAmountZero

  const { hasGasTank, isViewOnly } = useHasGasTank({ account })

  const unavailableBecauseGasTankOrRewardsTokenTooltipText = t(
    'Unavailable. {{tokenType}} tokens cannot be sent, swapped, or bridged.',
    {
      tokenType: isGasTankToken ? t('Gas Tank') : t('Reward')
    }
  )

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
    },
    [hideToken, closeHideTokenModal]
  )

  const topUpDisabledTooltipText = useMemo(() => {
    if (!hasGasTank) {
      if (isViewOnly) {
        return t('Not available for view-only accounts.')
      }
      return t(`Not available for ${account?.safeCreation ? 'safe' : 'hardware'} wallets, yet.`)
    }

    if (!canToToppedUp) {
      return t(
        'This token is not eligible for filling up the Gas Tank. Please select a supported token instead.'
      )
    }

    if (gasTankAssetsError) {
      return gasTankAssetsError
    }

    return undefined
  }, [hasGasTank, canToToppedUp, gasTankAssetsError, isViewOnly, t, account?.safeCreation])

  const actions = useMemo(
    () =>
      [
        {
          id: 'send',
          text: t('Send'),
          icon: SendIcon,
          onPress: ({ chainId, address }: TokenResult) =>
            navigate(`${ROUTES.transfer}?chainId=${chainId}&address=${address}`),
          isDisabled: isGasTankOrRewardsToken || isAmountZero || network?.isNotSupported,
          tooltipText: isGasTankOrRewardsToken
            ? unavailableBecauseGasTankOrRewardsTokenTooltipText
            : network?.isNotSupported
              ? network?.notSupportedReason
              : '',
          strokeWidth: 1.5,
          testID: 'token-send'
        },
        isWeb && {
          id: 'swap-or-bridge',
          text: t('Swap or Bridge'),
          icon: SwapAndBridgeIcon,
          iconWidth: 86,
          onPress: ({ chainId, address }: TokenResult) =>
            navigate(ROUTES.swapAndBridge, {
              state: {
                preselectedFromToken: {
                  address,
                  chainId
                }
              }
            }),
          isDisabled: shouldDisableSwapAndBridge,
          tooltipText: isGasTankOrRewardsToken
            ? unavailableBecauseGasTankOrRewardsTokenTooltipText
            : network?.isNotSupported
              ? network?.notSupportedReason
              : '',
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
            if (canTopUp) navigate(`${ROUTES.topUpGasTank}?chainId=${chainId}&address=${address}`)
            else addToast('We have disabled top ups with this token.', { type: 'error' })
          },
          isDisabled: !!topUpDisabledTooltipText,
          tooltipText: topUpDisabledTooltipText,
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
          id: 'hide-unhide',
          testID: 'hide-token-button',
          isDisabled: isGasTankOrRewardsToken,
          tooltipText: isGasTankOrRewardsToken
            ? t('Hiding is not available for Gas Tank or Reward tokens.')
            : undefined,
          text: isHidden ? t('Unhide') : t('Hide'),
          icon: isHidden ? VisibilityIcon : InvisibilityIcon,
          // @TODO: Handle unhide and make the UX good
          onPress: handleHideTokenFromButton
        }
      ].filter(Boolean) as any[],
    [
      t,
      isGasTankOrRewardsToken,
      isAmountZero,
      unavailableBecauseGasTankOrRewardsTokenTooltipText,
      shouldDisableSwapAndBridge,
      network?.isNotSupported,
      network?.notSupportedReason,
      topUpDisabledTooltipText,
      isHidden,
      handleHideTokenFromButton,
      navigate,
      gasTankAssets,
      gasTankAssetsError,
      addToast
    ]
  )

  return {
    token,
    networks,
    hideTokenModalRef,
    closeHideTokenModal,
    handleHideTokenFromModal,
    actions
  }
}

export default useTokenDetails
