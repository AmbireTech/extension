import { formatUnits } from 'ethers'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { SwapAndBridgeActiveRoute } from '@ambire-common/interfaces/swapAndBridge'
import { isTxnBridge } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import CloseIcon from '@common/assets/svg/CloseIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import RouteStepsPreview from '@common/modules/swap-and-bridge/components/RouteStepsPreview'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import formatTime from '@common/utils/formatTime'

import MoreDetails from './MoreDetails'
import getStyles from './styles'

const ActiveRouteCard = ({ activeRoute }: { activeRoute: SwapAndBridgeActiveRoute }) => {
  const { styles, theme } = useTheme(getStyles)
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { dispatch: mainDispatch } = useController('MainController')
  const { navigate } = useNavigation()

  const activeTransaction = useMemo(() => {
    const isInProgress = activeRoute.routeStatus === 'in-progress'

    // If the transaction is in progress we need to mark the bridge request as active
    if (isInProgress) {
      const bridgeRequest = activeRoute.route?.userTxs.find((tx) => isTxnBridge(tx))

      return bridgeRequest || activeRoute.route?.userTxs[activeRoute.route.currentUserTxIndex]
    }

    return activeRoute.route?.userTxs[activeRoute.route.currentUserTxIndex]
  }, [activeRoute.route?.currentUserTxIndex, activeRoute.route?.userTxs, activeRoute.routeStatus])

  const { steps } = activeRoute.route || {}
  const inputValueInUsd = activeRoute.route?.inputValueInUsd
  const outputValueInUsd = activeRoute.route?.outputValueInUsd

  const handleRejectActiveRoute = useCallback(() => {
    mainDispatch({
      type: 'method',
      params: {
        method: 'removeActiveRoute',
        args: [activeRoute.activeRouteId]
      }
    })
  }, [activeRoute.activeRouteId, mainDispatch])

  const getPanelContainerStyle = useCallback(() => {
    let panelStyles = {}
    if (activeRoute.error)
      panelStyles = {
        borderWidth: 1,
        backgroundColor: theme.errorBackground,
        borderColor: theme.errorDecorative
      }
    if (activeRoute.routeStatus === 'completed')
      panelStyles = {
        borderWidth: 1,
        backgroundColor: theme.successBackground,
        borderColor: theme.successDecorative
      }
    if (activeRoute.routeStatus === 'refunded')
      panelStyles = {
        borderWidth: 1,
        backgroundColor: theme.warningBackground,
        borderColor: theme.warningDecorative
      }

    return { ...panelStyles, ...spacings.mbTy }
  }, [activeRoute.error, activeRoute.routeStatus, theme])

  const routeText = useMemo(() => {
    if (activeRoute.routeStatus === 'completed') return 'Completed Route'
    if (activeRoute.routeStatus === 'refunded') return 'Refunded Route'
    return 'Pending Route'
  }, [activeRoute.routeStatus])

  const refunded = useMemo(() => {
    if (!steps || steps.length === 0) return null
    const firstStep = steps[0]

    if (!firstStep) return null

    if (steps.length === 1) {
      return {
        amount: firstStep.fromAmount,
        asset: firstStep.fromAsset
      }
    }

    const lastCompletedStep = steps[1]
    if (!lastCompletedStep) return null

    return {
      amount: firstStep.toAmount,
      asset: lastCompletedStep.fromAsset
    }
  }, [steps])

  return (
    <Panel spacingsSize="small" style={getPanelContainerStyle()}>
      {(activeRoute.routeStatus === 'completed' || activeRoute.routeStatus === 'refunded') && (
        <Pressable style={styles.closeIcon} onPress={handleRejectActiveRoute}>
          <CloseIcon />
        </Pressable>
      )}
      <Text
        appearance="secondaryText"
        fontSize={14}
        weight="medium"
        style={isMobile ? spacings.mbSm : spacings.mbMi}
      >
        {t(routeText)}
      </Text>
      <View
        style={[
          styles.container,
          activeRoute.routeStatus === 'completed' && { backgroundColor: '#767DAD14' },
          activeRoute.routeStatus === 'refunded' && { backgroundColor: theme.warningBackground }
        ]}
      >
        <RouteStepsPreview
          steps={steps || []}
          currentStep={activeRoute.route?.currentUserTxIndex}
          loadingEnabled={
            !!activeRoute.userTxHash &&
            (activeRoute.routeStatus === 'in-progress' ||
              activeRoute.routeStatus === 'waiting-approval-to-resolve')
          }
          routeStatus={activeRoute.routeStatus}
          inputValueInUsd={inputValueInUsd}
          outputValueInUsd={outputValueInUsd}
          providerId={
            activeRoute.route ? activeRoute.route.providerId : activeRoute.serviceProviderId
          }
          isBridge={
            !!activeRoute.route && activeRoute.route.fromChainId !== activeRoute.route.toChainId
          }
        />
      </View>

      {activeRoute.routeStatus !== 'completed' && activeRoute.routeStatus !== 'refunded' && (
        <View style={[spacings.ptSm, flexbox.directionRow, flexbox.alignCenter]}>
          {!activeRoute.error && (
            <View style={[flexbox.directionRow, flexbox.flex1, flexbox.alignCenter]}>
              {activeRoute.routeStatus === 'in-progress' &&
                activeTransaction &&
                isTxnBridge(activeTransaction) && (
                  <>
                    <Text
                      fontSize={12}
                      weight="medium"
                      style={spacings.mrMi}
                      appearance="secondaryText"
                    >
                      {t('Estimated bridge time:')}
                    </Text>

                    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                      <Text
                        fontSize={12}
                        weight="medium"
                        appearance="primary"
                        style={spacings.mrTy}
                      >
                        {t('around')} {formatTime(activeTransaction?.serviceTime || 0)}
                      </Text>
                      <Spinner style={{ width: 16, height: 16 }} />
                    </View>
                  </>
                )}
              {activeRoute.routeStatus === 'in-progress' &&
                activeTransaction &&
                !isTxnBridge(activeTransaction) && (
                  <>
                    <Text
                      fontSize={12}
                      weight="medium"
                      style={spacings.mrTy}
                      appearance="secondaryText"
                    >
                      {t('Swap in progress')}
                    </Text>
                    <Spinner style={{ width: 16, height: 16 }} />
                  </>
                )}
              {activeRoute.routeStatus === 'waiting-approval-to-resolve' && (
                <>
                  <Text
                    fontSize={12}
                    weight="medium"
                    style={spacings.mrTy}
                    appearance="secondaryText"
                  >
                    {t('Approval in progress')}
                  </Text>
                  <Spinner style={{ width: 16, height: 16 }} />
                </>
              )}
            </View>
          )}
          {!!activeRoute.error && (
            <View
              style={[
                flexbox.directionRow,
                flexbox.justifySpaceBetween,
                flexbox.alignCenter,
                { width: '100%' }
              ]}
            >
              <Text
                fontSize={12}
                weight="medium"
                style={[spacings.mrTy, flexbox.flex1]}
                appearance="errorText"
              >
                {activeRoute.error}
              </Text>
              {activeRoute.route && steps?.length && (
                <Button
                  onPress={() => {
                    const firstStep = steps[0]
                    const lastStep = steps[steps.length - 1]

                    if (!firstStep || !lastStep) {
                      addToast('Failed to retry the route, missing route steps', { type: 'error' })
                      return
                    }

                    navigate(WEB_ROUTES.swapAndBridge, {
                      state: {
                        preselectedFromToken: {
                          address: firstStep.fromAsset.address,
                          chainId: BigInt(firstStep.fromAsset.chainId)
                        },
                        preselectedToToken: {
                          address: lastStep.toAsset.address,
                          chainId: BigInt(lastStep.toAsset.chainId)
                        },
                        fromAmount: formatDecimals(
                          Number(formatUnits(firstStep.fromAmount, firstStep.fromAsset.decimals)),
                          'precise'
                        ),
                        activeRouteIdToDelete: activeRoute.activeRouteId
                      }
                    })
                  }}
                  type="primary"
                  size="small"
                  text={t('Retry')}
                />
              )}
            </View>
          )}
          {activeRoute.routeStatus === 'in-progress' && activeRoute.userTxHash && (
            <MoreDetails activeRoute={activeRoute} />
          )}
        </View>
      )}
      {activeRoute.routeStatus === 'refunded' && (
        <View
          style={[
            spacings.ptSm,
            flexbox.directionRow,
            flexbox.alignEnd,
            flexbox.justifySpaceBetween
          ]}
        >
          <Text fontSize={12} weight="medium" appearance="secondaryText">
            {t('Bridge failed! Account refunded with {{token}}', {
              token: refunded
                ? `${formatDecimals(
                    Number(formatUnits(refunded.amount, refunded.asset.decimals)),
                    'amount'
                  )} ${refunded.asset.symbol}`
                : 'the swapped token'
            })}
          </Text>
          <MoreDetails activeRoute={activeRoute} style={spacings.mtSm} />
        </View>
      )}
      {activeRoute.routeStatus === 'completed' && activeRoute.userTxHash && (
        <MoreDetails activeRoute={activeRoute} style={spacings.mtSm} />
      )}
    </Panel>
  )
}

export default React.memo(ActiveRouteCard)
