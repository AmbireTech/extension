import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import CheckedListIcon from '@common/assets/svg/CheckedListIcon'
import ExploreIcon from '@common/assets/svg/ExploreIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'

import SafeQueueBottomSheet, { getSafeQueueRequests } from '../SafeQueueBottomSheet'
import RouteItem from './RouteItem'
import { RouteItemType } from './RouteItem/RouteItem'

const Routes = () => {
  const { t } = useTranslation()
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const { accountStates } = useController('AccountsController').state
  const { userRequests } = useController('RequestsController').state
  const { ref: safeQueueSheetRef, open: openSafeQueue, close: closeSafeQueue } = useModalize()
  const currentNonces = useMemo(() => {
    if (!account) return {}

    return Object.fromEntries(
      Object.entries(accountStates[account.addr] || {}).map(([chainId, state]) => [
        chainId,
        state?.nonce
      ])
    )
  }, [account, accountStates])
  const safeQueueRequests = useMemo(
    () =>
      account && userRequests
        ? getSafeQueueRequests(userRequests, account.addr, currentNonces)
        : [],
    [account, currentNonces, userRequests]
  )
  const pendingSafeRequests = useMemo(() => {
    return safeQueueRequests.filter((r) => !r.meta.isSafeRejected)
  }, [safeQueueRequests])
  const handleOpenSafeQueue = useCallback(() => openSafeQueue(), [openSafeQueue])

  const routeItems: RouteItemType[] = useMemo(
    () => [
      {
        testID: 'dashboard-button-send',
        icon: SendIcon,
        label: t('Send'),
        route: ROUTES.transfer,
        scale: 1.08,
        scaleOnHover: 1.18
      },
      ...(isMobile
        ? [
            {
              testID: 'dashboard-button-receive',
              icon: ReceiveIcon,
              label: t('Receive'),
              route: ROUTES.receive,
              scale: 1.08,
              scaleOnHover: 1.18
            }
          ]
        : []),
      {
        testID: 'dashboard-button-swap-and-bridge',
        icon: SwapAndBridgeIcon,
        label: t('Swap & Bridge'),
        route: ROUTES.swapAndBridge,
        scale: 0.95,
        scaleOnHover: 1
      },
      {
        testID: 'dashboard-button-explore',
        icon: ExploreIcon,
        label: t('Explore'),
        route: ROUTES.explore,
        scale: 0.95,
        scaleOnHover: 1.02
      },
      ...(!isMobile && account?.safeCreation
        ? [
            {
              testID: 'dashboard-button-safe-queue',
              icon: CheckedListIcon,
              label: t('Queue'),
              onPress: handleOpenSafeQueue,
              badge: pendingSafeRequests.length,
              scale: 0.95,
              scaleOnHover: 1.02
            }
          ]
        : [])
    ],
    [account?.safeCreation, handleOpenSafeQueue, pendingSafeRequests.length, t]
  )

  return (
    <>
      {!isMobile && account?.safeCreation && (
        <SafeQueueBottomSheet
          sheetRef={safeQueueSheetRef}
          closeBottomSheet={closeSafeQueue}
          requests={safeQueueRequests}
          currentNonces={currentNonces}
        />
      )}
      <View style={[flexbox.directionRow]}>
        {routeItems.map((routeItem, index) => (
          <RouteItem
            key={routeItem.label}
            routeItem={routeItem}
            index={index}
            routeItemsLength={routeItems.length}
          />
        ))}
      </View>
    </>
  )
}

export default React.memo(Routes)
