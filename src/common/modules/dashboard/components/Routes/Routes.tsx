import React from 'react'
import { View } from 'react-native'

import DAppsIcon from '@common/assets/svg/DAppsIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'

import RouteItem from './RouteItem'
import { RouteItemType } from './RouteItem/RouteItem'

const Routes = () => {
  const { t } = useTranslation()

  const routeItems: RouteItemType[] = [
    {
      testID: 'dashboard-button-send',
      icon: SendIcon,
      label: t('Send'),
      route: ROUTES.transfer,
      scale: 1.08,
      scaleOnHover: 1.18
    },
    ...(isWeb
      ? [
          {
            testID: 'dashboard-button-swap-and-bridge',
            icon: SwapAndBridgeIcon,
            label: t('Swap & Bridge'),
            route: ROUTES.swapAndBridge,
            scale: 0.95,
            scaleOnHover: 1
          }
        ]
      : []),
    {
      testID: 'dashboard-button-apps',
      icon: DAppsIcon,
      label: t('Apps'),
      // route: ROUTES.apps,
      scale: 0.95,
      scaleOnHover: 1.02
    }
  ]

  return (
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
  )
}

export default React.memo(Routes)
