import React from 'react'
import { View } from 'react-native'

import rewardsBg from '@common/assets/images/rewards-bg.png'
import BadgeIcon from '@common/assets/svg/BadgeIcon'
import DAppsIcon from '@common/assets/svg/DAppsIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import { useTranslation } from '@common/config/localization'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
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
      route: WEB_ROUTES.transfer,
      scale: 1.08,
      scaleOnHover: 1.18
    },
    {
      testID: 'dashboard-button-swap-and-bridge',
      icon: SwapAndBridgeIcon,
      label: t('Swap & Bridge'),
      route: WEB_ROUTES.swapAndBridge,
      scale: 0.95,
      scaleOnHover: 1
    },
    {
      testID: 'dashboard-button-apps',
      icon: DAppsIcon,
      label: t('Apps'),
      route: WEB_ROUTES.apps,
      scale: 0.95,
      scaleOnHover: 1.02
    },
    {
      testID: 'dashboard-button-rewards',
      icon: BadgeIcon,
      label: t('Rewards'),
      route: WEB_ROUTES.rewards,
      scale: 1,
      scaleOnHover: 1.2,
      backgroundImage: rewardsBg
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
