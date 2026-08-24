import { formatUnits } from 'ethers'
import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Hex } from '@ambire-common/interfaces/hex'
import { SwapAndBridgeActiveRoute } from '@ambire-common/interfaces/swapAndBridge'
import { getIsBridgeRoute, getLink } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Text from '@common/components/Text'
import TrackProgressWrapper from '@common/components/TrackProgress'
import Completed from '@common/components/TrackProgress/ByStatus/Completed'
import Failed from '@common/components/TrackProgress/ByStatus/Failed'
import InProgress from '@common/components/TrackProgress/ByStatus/InProgress'
import Refunded from '@common/components/TrackProgress/ByStatus/Refunded'
import useController from '@common/hooks/useController'
import useControllerSession from '@common/hooks/useControllerSession'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import useTrackAccountOp from '@common/modules/sign-account-op/hooks/OneClick/useTrackAccountOp'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import formatTime from '@common/utils/formatTime'
import { getUiType } from '@common/utils/uiType'

import RouteStepsToken from '../RouteStepsToken'

import {
  getSwapCompletedMessageTemplate,
  getSwapInProgressMessage
} from './getSwapCompletedMessage'

const { isRequestWindow } = getUiType()

type Props = {
  activeRoute: SwapAndBridgeActiveRoute
  handleClose: () => void
}

const buildCompletedMessage = (
  activeRouteId: SwapAndBridgeActiveRoute['activeRouteId'],
  toAssetSymbol: string | null,
  translate: (key: string, options?: { symbol: string }) => string
) => {
  const template = getSwapCompletedMessageTemplate(toAssetSymbol, activeRouteId)
  const symbol = toAssetSymbol || 'The token'

  return {
    title: translate(template.title),
    titleSecondary: template.titleSecondary
      ? translate(template.titleSecondary, { symbol })
      : undefined
  }
}

const TrackProgress: FC<Props> = ({ activeRoute, handleClose }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const { activeRoutes } = useController('SwapAndBridgeController').state
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { account } = useController('SelectedAccountController').state

  const lastCompletedRoute =
    activeRoutes.find((r) => r.activeRouteId === activeRoute?.activeRouteId) || activeRoute
  const steps = lastCompletedRoute?.route?.steps
  const firstStep = steps ? steps[0] : null
  const lastStep = steps ? steps[steps.length - 1] : null
  const fromAsset = firstStep ? firstStep.fromAsset : null
  const toAsset = lastStep ? lastStep.toAsset : null
  const toAssetSymbol = steps ? steps[steps.length - 1]!.toAsset.symbol : null
  const isSwap = lastCompletedRoute?.route && !getIsBridgeRoute(lastCompletedRoute?.route)
  const providerId = lastCompletedRoute?.route
    ? lastCompletedRoute.route.providerId
    : lastCompletedRoute?.serviceProviderId

  const inProgressMessage = t(getSwapInProgressMessage(lastCompletedRoute.activeRouteId))

  const completedMessage =
    lastCompletedRoute?.routeStatus === 'completed'
      ? buildCompletedMessage(lastCompletedRoute.activeRouteId, toAssetSymbol, t)
      : null

  const refunded = useMemo(() => {
    if (!steps || steps.length === 0 || !firstStep) return null

    const lastCompletedStep = steps[1]
    if (!lastCompletedStep) {
      return {
        amount: firstStep.fromAmount,
        asset: firstStep.fromAsset
      }
    }
    return {
      amount: firstStep.toAmount,
      asset: lastCompletedStep.fromAsset
    }
  }, [firstStep, steps])

  const navigateOut = useCallback(() => {
    if (isRequestWindow) {
      if (!account) return

      requestsDispatch({
        type: 'method',
        params: {
          method: 'removeUserRequests',
          args: [[`${account.addr}-swap-and-bridge-sign`]]
        }
      })
    } else {
      navigate(WEB_ROUTES.dashboard)
    }
  }, [account, navigate, requestsDispatch])

  const { sessionHandler } = useTrackAccountOp({
    address: lastCompletedRoute?.route?.userAddress,
    chainId: lastCompletedRoute?.route?.fromChainId
      ? BigInt(lastCompletedRoute?.route.fromChainId)
      : undefined,
    sessionId: 'swapAndBridge'
  })

  useControllerSession({
    // Optimization: Don't apply filtration if we don't have a completed route.
    isEnabled:
      !!lastCompletedRoute?.userTxHash &&
      !!lastCompletedRoute?.route?.fromChainId &&
      !!lastCompletedRoute?.route.userAddress,
    open: sessionHandler.initSession,
    close: sessionHandler.killSession
  })

  const explorerLink = useMemo(() => {
    if (!lastCompletedRoute) return
    if (providerId === 'uniswap') return

    if (!isSwap) {
      return getLink(lastCompletedRoute)
    }
    const toChainId = lastCompletedRoute?.route?.toChainId
    if (!toChainId) return

    const { identifiedBy } = lastCompletedRoute

    if (!identifiedBy) return

    return `https://explorer.ambire.com/${getBenzinUrlParams({
      chainId: toChainId,
      txnId: lastCompletedRoute.userTxHash,
      identifiedBy
    })}`
  }, [isSwap, lastCompletedRoute, providerId])

  return (
    <TrackProgressWrapper
      onPrimaryButtonPress={navigateOut}
      secondaryButtonText={t('Start a new swap?')}
      handleClose={handleClose}
      routeStatus={lastCompletedRoute?.routeStatus}
    >
      {lastCompletedRoute?.routeStatus === 'in-progress' && (
        <InProgress title={inProgressMessage}>
          {!!fromAsset && !!toAsset && (
            <>
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.justifySpaceBetween,
                  // Not baseline, because a wrapping token symbol moves the card's
                  // text baseline and vertically offsets it from the other card.
                  flexbox.alignCenter,
                  spacings.mbLg
                ]}
              >
                <RouteStepsToken
                  uri={fromAsset.icon}
                  chainId={BigInt(fromAsset.chainId)}
                  address={fromAsset.address}
                  symbol={fromAsset.symbol}
                  amount={
                    lastCompletedRoute?.route?.fromAmount
                      ? formatDecimals(
                          Number(
                            formatUnits(lastCompletedRoute.route?.fromAmount, fromAsset.decimals)
                          ),
                          'amount'
                        )
                      : ''
                  }
                  wrapperStyle={{
                    width: 160,
                    height: 112,
                    backgroundColor: theme.secondaryBackground,
                    borderRadius: BORDER_RADIUS_PRIMARY,
                    ...flexbox.center
                  }}
                />
                <View
                  style={[flexbox.alignCenter, flexbox.justifyCenter, { width: 8, zIndex: 100 }]}
                >
                  <View
                    style={{
                      borderRadius: 100,
                      backgroundColor: theme.secondaryBackground,
                      borderWidth: 4,
                      borderColor: theme.secondaryBorder,
                      ...flexbox.alignCenter,
                      ...flexbox.justifyCenter,
                      width: 36,
                      height: 36,
                      position: 'absolute',
                      zIndex: 100
                    }}
                  >
                    <RightArrowIcon color={theme.neutral600} />
                  </View>
                </View>
                <RouteStepsToken
                  uri={toAsset.icon}
                  chainId={BigInt(toAsset.chainId)}
                  address={toAsset.address}
                  symbol={toAsset.symbol}
                  isLast
                  amount={
                    lastCompletedRoute.route?.toAmount
                      ? formatDecimals(
                          Number(formatUnits(lastCompletedRoute.route?.toAmount, toAsset.decimals)),
                          'amount'
                        )
                      : ''
                  }
                  wrapperStyle={{
                    width: 160,
                    height: 112,
                    backgroundColor: theme.secondaryBackground,
                    borderRadius: BORDER_RADIUS_PRIMARY,
                    ...flexbox.center
                  }}
                />
              </View>
              <View>
                {!!lastCompletedRoute.route?.serviceTime && (
                  <Text
                    fontSize={12}
                    weight="medium"
                    appearance="secondaryText"
                    style={text.center}
                  >
                    {t('Time: {{time}}', {
                      time: getIsBridgeRoute(lastCompletedRoute.route)
                        ? `~ ${formatTime(lastCompletedRoute.route?.serviceTime)}`
                        : 'instant'
                    })}
                  </Text>
                )}
              </View>
            </>
          )}
        </InProgress>
      )}

      {lastCompletedRoute?.routeStatus === 'completed' && !!completedMessage && (
        <Completed
          title={completedMessage.title}
          titleSecondary={completedMessage.titleSecondary}
          openExplorerText={isSwap ? t('View swap') : t('View bridge')}
          explorerLink={explorerLink}
        />
      )}

      {lastCompletedRoute?.routeStatus === 'failed' && (
        <Failed
          activeRouteIdToDelete={lastCompletedRoute.activeRouteId}
          title={t(isSwap ? 'Swap failed' : 'Bridge failed')}
          errorMessage={`Error: ${lastCompletedRoute.error!}`}
          toToken={
            lastStep
              ? {
                  address: lastStep.toAsset.address as Hex,
                  chainId: String(lastStep.toAsset.chainId)
                }
              : undefined
          }
          amount={
            firstStep
              ? formatDecimals(
                  Number(formatUnits(firstStep.fromAmount, firstStep.fromAsset.decimals)),
                  'precise'
                )
              : undefined
          }
          handleClose={handleClose}
        />
      )}

      {lastCompletedRoute?.routeStatus === 'refunded' && (
        <Refunded
          title={t('Bridge refunded')}
          titleSecondary={t('{{token}} was refunded to your account as the bridge failed.', {
            token: refunded
              ? `${formatDecimals(
                  Number(formatUnits(refunded.amount, refunded.asset.decimals)),
                  'amount'
                )} ${refunded.asset.symbol}`
              : 'The swapped token'
          })}
          openExplorerText={t('More details')}
          explorerLink={explorerLink}
        />
      )}
    </TrackProgressWrapper>
  )
}

export default TrackProgress
