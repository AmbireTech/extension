import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import { getIsIntentRoute } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import BottomSheet from '@common/components/BottomSheet'
import DualChoiceModal from '@common/components/DualChoiceModal'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import ActiveRouteCard from '@common/modules/swap-and-bridge/components/ActiveRouteCard'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

type Props = {
  id: string
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
}

const WITH_BOTTOM_SHEET = ['update-available', 'bridge-in-progress']
const RENDER_AS_MODAL = ['update-available']

const selectActiveRoutes = (state: AllControllersMappingType['SwapAndBridgeController']) =>
  state.activeRoutes

const style: {
  [key: string]: ViewStyle
} = {
  'update-available': {
    overflow: 'hidden',
    width: 496,
    ...spacings.ph0,
    ...spacings.pv0
  }
}

const DashboardBannerBottomSheet: FC<Props> = ({ id, sheetRef, closeBottomSheet }) => {
  const { t } = useTranslation()
  const { dispatch: extensionUpdateDispatch } = useController('ExtensionUpdateController')
  const { state: activeRoutes } = useController('SwapAndBridgeController', selectActiveRoutes)
  const intentRoutes = useMemo(
    () =>
      activeRoutes.filter(
        (activeRoute) =>
          activeRoute.route &&
          getIsIntentRoute(activeRoute.route) &&
          (activeRoute.routeStatus === 'in-progress' ||
            activeRoute.routeStatus === 'completed' ||
            activeRoute.routeStatus === 'refunded' ||
            activeRoute.routeStatus === 'failed')
      ),
    [activeRoutes]
  )

  if (!WITH_BOTTOM_SHEET.includes(id)) return null

  return (
    <BottomSheet
      id={`${id}-bottom-sheet`}
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      style={style[id]}
      type={RENDER_AS_MODAL.includes(id) ? 'modal' : undefined}
    >
      {id === 'update-available' && (
        <DualChoiceModal
          title={t('Are you sure you want to reload the extension?') as string}
          description={
            t(
              'You have pending actions. Reloading the extension will discard all pending actions and unsaved changes.'
            ) as string
          }
          primaryButtonText={t('Reload now')}
          onPrimaryButtonPress={() =>
            extensionUpdateDispatch({
              type: 'method',
              params: {
                method: 'applyUpdate',
                args: []
              }
            })
          }
          secondaryButtonText={t('Cancel')}
          onSecondaryButtonPress={closeBottomSheet}
        />
      )}
      {id === 'bridge-in-progress' && (
        <View style={[flexbox.flex1, spacings.ptSm]}>
          <Text
            fontSize={isMobile ? 20 : 16}
            weight="medium"
            style={[spacings.mbLg, isMobile && text.center]}
          >
            {t('Pending transactions')}
          </Text>
          {intentRoutes.map((activeRoute) => (
            <View key={activeRoute.activeRouteId} style={spacings.mbTy}>
              <ActiveRouteCard activeRoute={activeRoute} />
            </View>
          ))}
        </View>
      )}
    </BottomSheet>
  )
}

export default React.memo(DashboardBannerBottomSheet)
