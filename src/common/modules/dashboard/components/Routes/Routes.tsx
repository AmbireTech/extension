import React from 'react'
import { View } from 'react-native'

import DAppsIcon from '@common/assets/svg/DAppsIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import { useTranslation } from '@common/config/localization'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'

import RouteItem from './RouteItem'

const Routes = ({ openReceiveModal }: { openReceiveModal: () => void }) => {
  const { t } = useTranslation()

  const routeItems = [
    {
      testID: 'dashboard-button-send',
      icon: SendIcon,
      label: t('Send'),
      route: WEB_ROUTES.transfer,
      isExternal: false
    },
    {
      testID: 'dashboard-button-receive',
      icon: ReceiveIcon,
      label: t('Receive'),
      onPress: openReceiveModal,
      isExternal: false
    },
    {
      testID: 'dashboard-button-swap-and-bridge',
      icon: SwapAndBridgeIcon,
      label: t('Swap & Bridge'),
      route: WEB_ROUTES.swapAndBridge,
      isExternal: false
    },
    {
      testID: 'dashboard-button-apps',
      icon: DAppsIcon,
      label: t('Apps'),
      route: WEB_ROUTES.appCatalog,
      isExternal: false
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
