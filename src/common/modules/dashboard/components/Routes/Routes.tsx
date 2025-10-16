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

const Routes = () => {
  const { t } = useTranslation()

  const routeItems = [
    {
      testID: 'dashboard-button-send',
      icon: SendIcon,
      label: t('Send'),
      route: WEB_ROUTES.transfer,
      isExternal: false,
      scale: 1.08,
      scaleOnHover: 1.18
    },
    {
      testID: 'dashboard-button-swap-and-bridge',
      icon: SwapAndBridgeIcon,
      label: t('Swap & Bridge'),
      route: WEB_ROUTES.swapAndBridge,
      isExternal: false,
      scale: 0.95,
      scaleOnHover: 1
    },
    {
      testID: 'dashboard-button-apps',
      icon: DAppsIcon,
      label: t('Apps'),
      route: WEB_ROUTES.appCatalog,
      isExternal: false,
      scale: 0.95,
      scaleOnHover: 1.02
    },
    {
      testID: 'dashboard-button-quests',
      icon: BadgeIcon,
      label: t('Rewards'),
      route:
        'https://rewards.ambire.com/?utm_source=extension&utm_medium=button&utm_campaign=measure-button',
      isExternal: true,
      scale: 0.95,
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
