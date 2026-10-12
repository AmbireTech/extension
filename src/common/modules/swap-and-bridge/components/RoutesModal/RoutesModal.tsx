import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, ScrollView, View } from 'react-native'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { SwapAndBridgeRoute } from '@ambire-common/interfaces/swapAndBridge'
import { getIsBridgeRoute } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import HoverablePressable from '@common/components/HoverablePressable'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import RouteStepsPreview from '@common/modules/swap-and-bridge/components/RouteStepsPreview'
import {
  formatRouteToTokenAmount,
  getRouteExtraBridgeFeeLabel,
  getRouteMinReceiveAmount,
  getRouteNetworkFeeInToToken,
  getRouteNetworkFeeInUsd
} from '@common/modules/swap-and-bridge/components/RouteStepsPreview/helpers'
import spacings, { SPACING_LG, SPACING_TY } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'
import RetryButton from '@web/components/RetryButton'
import { TRANSACTION_FORM_WIDTH } from '@web/components/TransactionsScreen/styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

import getStyles from './styles'

// The approximate height of a swap route card with two route details rows (min receive and
// network fee), including its bottom margin. Used only for cards that haven't rendered yet,
// as the rendered cards are measured (bridge cards are taller by 28px per extra row).
const FLAT_LIST_ITEM_HEIGHT = 199.5

const { isPopup } = getUiType()

const selectDisabledSwapProviderIds = (
  state: AllControllersMappingType['SwapAndBridgeController']
) => state.disabledSwapProviderIds

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

const RoutesModal = ({
  sheetRef,
  closeBottomSheet,
  openProviderSettingsBottomSheet
}: {
  sheetRef: React.RefObject<any>
  closeBottomSheet: (dest?: 'default' | 'alwaysOpen' | undefined) => void
  openProviderSettingsBottomSheet: () => void
}) => {
  const { t } = useTranslation()
  const { isNarrowWebLayout } = useCompactLayout()
  const { styles, theme } = useTheme(getStyles)
  const { quote, signAccountOpController, updateQuoteStatus } =
    useController('SwapAndBridgeController').state
  const { state: disabledSwapProviderIds } = useController(
    'SwapAndBridgeController',
    selectDisabledSwapProviderIds
  )
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')
  const { state: networks } = useController('NetworksController', selectNetworks)
  const scrollRef = useRef<FlatList<SwapAndBridgeRoute>>(null)
  // Measured card heights (without the bottom margin), keyed by route id
  const routeCardHeightsRef = useRef<Record<string, number>>({})
  const scrollToSelectedRouteTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const shouldOpenProviderSettingsOnClose = useRef(false)
  const { height } = useWindowSize()
  // there's a small discrepancy between ticks and we want to capture that
  const [userSelectedRoute, setUserSelectedRoute] = useState<SwapAndBridgeRoute | undefined>(
    undefined
  )
  const [isEstimationLoading, setIsEstimationLoading] = useState<boolean>(false)
  const [listHeight, setListHeight] = useState<number>(500)

  const persistedSelectedRoute = useMemo(() => {
    return quote?.selectedRoute
  }, [quote?.selectedRoute])

  useEffect(() => {
    setUserSelectedRoute(persistedSelectedRoute)
  }, [persistedSelectedRoute])

  // The extra bridge fee is paid in the native token of the network the tokens are sent from
  const fromNetworkNativeSymbol = useMemo(() => {
    if (!quote?.fromChainId) return undefined
    const fromChainId = BigInt(quote.fromChainId)

    return networks.find((network) => network.chainId === fromChainId)?.nativeAssetSymbol
  }, [networks, quote?.fromChainId])

  // Fills the empty space left of the provider logo, aligned with the route details labels
  const providerLabel = useMemo(
    () => (
      <Text fontSize={12} weight="medium" appearance="secondaryText">
        {t('Provider')}
      </Text>
    ),
    [t]
  )

  useEffect(() => {
    const currentRouteIds = new Set((quote?.routes || []).map((route) => String(route.routeId)))

    Object.keys(routeCardHeightsRef.current).forEach((routeId) => {
      if (!currentRouteIds.has(routeId)) delete routeCardHeightsRef.current[routeId]
    })
  }, [quote?.routes])

  useEffect(() => () => clearTimeout(scrollToSelectedRouteTimeoutRef.current), [])

  const disabledRoutes = useMemo(() => {
    if (!quote) return []
    return quote.routes.filter((route) => route.disabled)
  }, [quote])

  const handleSelectRoute = useCallback(
    (route: SwapAndBridgeRoute) => {
      if (!route) return
      if (disabledRoutes.find((r) => r.routeId === route.routeId)) return

      if (route.routeId === persistedSelectedRoute?.routeId) {
        closeBottomSheet()
        return
      }

      swapAndBridgeDispatch({
        type: 'method',
        params: { method: 'selectRoute', args: [route, { isManualSelection: true }] }
      })
      setUserSelectedRoute(route)
      setIsEstimationLoading(true)
    },
    [closeBottomSheet, swapAndBridgeDispatch, persistedSelectedRoute, disabledRoutes]
  )

  const updateQuote = useCallback(() => {
    swapAndBridgeDispatch({
      type: 'method',
      params: { method: 'updateQuote', args: [{ skipQuoteUpdateOnSameValues: false }] }
    })
  }, [swapAndBridgeDispatch])

  const isQuoteLoading = updateQuoteStatus === 'LOADING'

  const handleOpenProviderSettings = useCallback(() => {
    shouldOpenProviderSettingsOnClose.current = true
    closeBottomSheet()
  }, [closeBottomSheet])

  const handleRoutesModalClosed = useCallback(() => {
    if (!shouldOpenProviderSettingsOnClose.current) return

    shouldOpenProviderSettingsOnClose.current = false
    openProviderSettingsBottomSheet()
  }, [openProviderSettingsBottomSheet])

  const listFooterComponent = useMemo(() => {
    if (!disabledSwapProviderIds.length || isQuoteLoading) return null

    return (
      <HoverablePressable
        accessibilityRole="button"
        onPress={handleOpenProviderSettings}
        testID="enable-more-swap-providers-button"
      >
        <View style={[flexbox.center, spacings.pv]}>
          <Text
            fontSize={14}
            weight="medium"
            color={theme.linkText}
            style={{
              textAlign: 'center',
              textDecorationColor: theme.linkText,
              textDecorationLine: 'underline'
            }}
          >
            {t('Enable other providers for more options')}
          </Text>
        </View>
      </HoverablePressable>
    )
  }, [
    disabledSwapProviderIds.length,
    handleOpenProviderSettings,
    isQuoteLoading,
    t,
    theme.linkText
  ])

  useEffect(() => {
    if (!signAccountOpController) return
    if (!isEstimationLoading) return
    if (!userSelectedRoute || !persistedSelectedRoute) return

    if (
      userSelectedRoute.routeId === persistedSelectedRoute.routeId &&
      signAccountOpController.estimation.status === EstimationStatus.Error
    ) {
      setIsEstimationLoading(false)
      swapAndBridgeDispatch({
        type: 'method',
        params: {
          method: 'markSelectedRouteAsFailed',
          args: [signAccountOpController.estimation.error?.message || 'Estimation failed']
        }
      })
    }

    if (
      userSelectedRoute.routeId === persistedSelectedRoute.routeId &&
      signAccountOpController.estimation.status === EstimationStatus.Success
    ) {
      setIsEstimationLoading(false)
      closeBottomSheet()
    }
  }, [
    userSelectedRoute,
    signAccountOpController,
    closeBottomSheet,
    persistedSelectedRoute,
    isEstimationLoading,
    disabledRoutes,
    swapAndBridgeDispatch
  ])

  const renderItem = useCallback(
    ({ item, index }: { item: SwapAndBridgeRoute; index: number }) => {
      if ((item as any).isSkeleton) {
        return <SkeletonLoader width="100%" height={listHeight} appearance="secondaryBackground" />
      }

      const { steps, inputValueInUsd, outputValueInUsd } = item
      const isEstimatingRoute = isEstimationLoading && item.routeId === userSelectedRoute?.routeId
      const isSelected = item.routeId === userSelectedRoute?.routeId && !isEstimatingRoute
      const minReceiveAmount = getRouteMinReceiveAmount(item)
      const networkFeeInToToken = getRouteNetworkFeeInToToken(item)

      return (
        <Pressable
          key={item.routeId}
          style={({ hovered }: any) => [
            styles.itemContainer,
            index + 1 === quote?.routes?.length && spacings.mb0,
            item.disabled && styles.disabledItem,
            isSelected && styles.selectedItem,
            isEstimationLoading && !isEstimatingRoute && styles.otherItemLoading
          ]}
          testID={isSelected ? 'selected-route' : ''}
          onLayout={(event) => {
            routeCardHeightsRef.current[String(item.routeId)] = event.nativeEvent.layout.height
          }}
          onPress={() => handleSelectRoute(item)}
          // Disable route selection if any route is being estimated
          disabled={isEstimationLoading || item.disabled}
        >
          {isEstimatingRoute && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2,
                backgroundColor: theme.backdrop,
                ...flexbox.alignCenter,
                ...flexbox.justifyCenter,
                ...common.borderRadiusPrimary
              }}
            >
              <Spinner style={{ width: 64, height: 64 }} variant="white" />
            </View>
          )}
          <RouteStepsPreview
            steps={steps}
            inputValueInUsd={inputValueInUsd}
            outputValueInUsd={outputValueInUsd}
            estimationInSeconds={item.serviceTime}
            minReceiveLabel={
              minReceiveAmount
                ? formatRouteToTokenAmount(minReceiveAmount, item.toToken)
                : undefined
            }
            networkFeeInToTokenLabel={
              networkFeeInToToken
                ? formatRouteToTokenAmount(networkFeeInToToken, item.toToken)
                : undefined
            }
            networkFeeInUsd={getRouteNetworkFeeInUsd(item)}
            extraBridgeFeeLabel={getRouteExtraBridgeFeeLabel(item, fromNetworkNativeSymbol)}
            isDisabled={item.disabled}
            disabledReason={item.disabledReason}
            providerId={item.providerId}
            isBridge={getIsBridgeRoute(item)}
            bottomLeftSlot={providerLabel}
          />
        </Pressable>
      )
    },
    [
      isEstimationLoading,
      userSelectedRoute?.routeId,
      styles.itemContainer,
      styles.disabledItem,
      styles.selectedItem,
      styles.otherItemLoading,
      quote?.routes?.length,
      handleSelectRoute,
      theme,
      listHeight,
      fromNetworkNativeSymbol,
      providerLabel
    ]
  )

  const selectedRouteIndex = useMemo(() => {
    if (!quote?.routes || !quote.routes.length) return 0
    if (!userSelectedRoute) return 0
    const selectedRouteIdx = quote.routes.findIndex((r) => r.routeId === userSelectedRoute.routeId)

    if (selectedRouteIdx === -1) return 0

    return selectedRouteIdx
  }, [quote?.routes, userSelectedRoute])

  const getSelectedRouteOffset = useCallback(() => {
    if (!quote?.routes) return 0

    return quote.routes.slice(0, selectedRouteIndex).reduce((offset, route) => {
      const measuredCardHeight = routeCardHeightsRef.current[String(route.routeId)]
      if (measuredCardHeight === undefined) return offset + FLAT_LIST_ITEM_HEIGHT

      return offset + measuredCardHeight + SPACING_TY
    }, 0)
  }, [quote?.routes, selectedRouteIndex])

  if ((!quote?.routes || !quote.routes.length) && updateQuoteStatus !== 'LOADING') return null

  return (
    <BottomSheet
      id="select-routes-modal"
      sheetRef={sheetRef}
      // On mobile, the list is rendered by Modalize, which ignores `flatListProps.ref` and
      // attaches this ref instead. On web, the list is rendered by the BottomSheet, so the
      // ref is passed with `flatListProps`. The cast is needed because the prop is typed
      // as a ScrollView, while Modalize attaches it to the FlatList it renders.
      scrollViewRef={isMobile ? (scrollRef as unknown as RefObject<ScrollView>) : undefined}
      closeBottomSheet={closeBottomSheet}
      adjustToContentHeight={isWeb}
      onClosed={handleRoutesModalClosed}
      HeaderComponent={
        <ModalHeader
          title={t('Select route')}
          handleClose={closeBottomSheet}
          titlePosition={isMobile ? 'left' : 'center'}
        >
          <RetryButton
            onPress={updateQuote}
            label={t('Request new quote')}
            disabled={isQuoteLoading}
            isLarge
          />
        </ModalHeader>
      }
      flatListProps={{
        // Spread, as Modalize's `flatListProps` type doesn't include `ref`, though the web
        // BottomSheet renders the FlatList with these props and attaches it
        ...{ ref: scrollRef },
        data: isQuoteLoading || !quote ? ([{ isSkeleton: true }] as any) : quote?.routes,
        renderItem,
        keyExtractor: (r: SwapAndBridgeRoute) =>
          (r as any).isSkeleton ? 'skeleton' : r.routeId.toString(),
        initialNumToRender: 6,
        windowSize: 6,
        maxToRenderPerBatch: 6,
        removeClippedSubviews: true,
        ListFooterComponent: listFooterComponent,
        onContentSizeChange: (_, contentHeight: number) => {
          if (contentHeight > 0 && contentHeight !== listHeight) {
            setListHeight(contentHeight)
          }
        }
      }}
      customRenderer={undefined}
      style={{
        overflow: 'hidden',
        width: isMobile ? 'auto' : isPopup || isNarrowWebLayout ? '100%' : TRANSACTION_FORM_WIDTH,
        minHeight: isMobile ? undefined : height * 0.7
      }}
      scrollViewProps={{
        contentContainerStyle: { flex: 1 },
        scrollEnabled: false
      }}
      onOpen={() => {
        if (!selectedRouteIndex) return

        clearTimeout(scrollToSelectedRouteTimeoutRef.current)
        scrollToSelectedRouteTimeoutRef.current = setTimeout(() => {
          try {
            scrollRef?.current?.scrollToIndex({
              index: selectedRouteIndex,
              animated: true,
              viewPosition: 0.1
            })
          } catch (e) {
            scrollRef?.current?.scrollToOffset({
              offset: getSelectedRouteOffset() - SPACING_LG,
              animated: true
            })
          }
        }, 100)
      }}
      containerInnerWrapperStyles={flexbox.flex1}
    />
  )
}

export default React.memo(RoutesModal)
