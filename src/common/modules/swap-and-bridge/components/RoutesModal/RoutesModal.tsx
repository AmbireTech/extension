import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, View } from 'react-native'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { SwapAndBridgeRoute } from '@ambire-common/interfaces/swapAndBridge'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Spinner from '@common/components/Spinner'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import RouteStepsPreview from '@common/modules/swap-and-bridge/components/RouteStepsPreview'
import spacings, { SPACING_LG } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'
import RetryButton from '@web/components/RetryButton'
import { TRANSACTION_FORM_WIDTH } from '@web/components/TransactionsScreen/styles'

import getStyles from './styles'

const FLAT_LIST_ITEM_HEIGHT = 138.5

const { isPopup } = getUiType()

const RoutesModal = ({
  sheetRef,
  closeBottomSheet
}: {
  sheetRef: React.RefObject<any>
  closeBottomSheet: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { quote, signAccountOpController, updateQuoteStatus } =
    useController('SwapAndBridgeController').state
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')
  const scrollRef = useRef<FlatList<SwapAndBridgeRoute>>(null)
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
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item, index }: { item: SwapAndBridgeRoute; index: number }) => {
      if ((item as any).isSkeleton) {
        return <SkeletonLoader width="100%" height={listHeight} appearance="secondaryBackground" />
      }

      const { steps, inputValueInUsd, outputValueInUsd, fromChainId, toChainId } = item
      const isEstimatingRoute = isEstimationLoading && item.routeId === userSelectedRoute?.routeId
      const isSelected = item.routeId === userSelectedRoute?.routeId && !isEstimatingRoute

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
            isDisabled={item.disabled}
            disabledReason={item.disabledReason}
            providerId={item.providerId}
            isBridge={fromChainId !== toChainId}
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
      theme
    ]
  )

  const selectedRouteIndex = useMemo(() => {
    if (!quote?.routes || !quote.routes.length) return 0
    if (!userSelectedRoute) return 0
    const selectedRouteIdx = quote.routes.findIndex((r) => r.routeId === userSelectedRoute.routeId)

    if (selectedRouteIdx === -1) return 0

    return selectedRouteIdx
  }, [quote?.routes, userSelectedRoute])

  if ((!quote?.routes || !quote.routes.length) && updateQuoteStatus !== 'LOADING') return null

  return (
    <BottomSheet
      id="select-routes-modal"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
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
        data: isQuoteLoading || !quote ? ([{ isSkeleton: true }] as any) : quote?.routes,
        renderItem,
        keyExtractor: (r: SwapAndBridgeRoute) =>
          (r as any).isSkeleton ? 'skeleton' : r.routeId.toString(),
        initialNumToRender: 6,
        windowSize: 6,
        maxToRenderPerBatch: 6,
        removeClippedSubviews: true,
        onContentSizeChange: (_, contentHeight: number) => {
          if (contentHeight > 0 && contentHeight !== listHeight) {
            setListHeight(contentHeight)
          }
        }
      }}
      customRenderer={undefined}
      style={{
        overflow: 'hidden',
        width: isMobile ? 'auto' : !isPopup ? TRANSACTION_FORM_WIDTH : '100%',
        minHeight: isMobile ? undefined : height * 0.7
      }}
      scrollViewProps={{
        contentContainerStyle: { flex: 1 },
        scrollEnabled: false
      }}
      onOpen={() => {
        if (!selectedRouteIndex) return

        setTimeout(() => {
          try {
            scrollRef?.current?.scrollToIndex({
              index: selectedRouteIndex,
              animated: true,
              viewPosition: 0.1
            })
          } catch (e) {
            scrollRef?.current?.scrollToOffset({
              offset: selectedRouteIndex * FLAT_LIST_ITEM_HEIGHT - SPACING_LG,
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
