import { memo, RefObject, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import { getIsIntentRoute } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import BottomSheet from '@common/components/BottomSheet'
import DualChoiceModal from '@common/components/DualChoiceModal'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import ActiveRouteCard from '@common/modules/swap-and-bridge/components/ActiveRouteCard'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import type { FC } from 'react'

type Props = {
  id: string
  // Every swap or bridge has its own banner, so its sheet shows only that one
  activeRouteId?: string
  sheetRef: RefObject<any>
  closeBottomSheet: () => void
}

const BRIDGE_IN_PROGRESS = 'bridge-in-progress'
const WITH_BOTTOM_SHEET = ['update-available', BRIDGE_IN_PROGRESS]
const RENDER_AS_MODAL = ['update-available']

const style: {
  [key: string]: ViewStyle
} = {
  'update-available': {
    overflow: 'hidden',
    width: '100%',
    maxWidth: 496,
    ...spacings.ph0,
    ...spacings.pv0
  }
}

const DashboardBannerBottomSheet: FC<Props> = ({
  id,
  activeRouteId,
  sheetRef,
  closeBottomSheet
}) => {
  const { t } = useTranslation()
  const { dispatch: extensionUpdateDispatch } = useController('ExtensionUpdateController')
  const { state: activeRoutes } = useController('SwapAndBridgeController', 'activeRoutes')
  const sheetKind = activeRouteId ? BRIDGE_IN_PROGRESS : id
  const intentRoutes = useMemo(
    () =>
      activeRoutes.filter(
        (activeRoute) =>
          (!activeRouteId || activeRoute.activeRouteId === activeRouteId) &&
          activeRoute.route &&
          getIsIntentRoute(activeRoute.route) &&
          (activeRoute.routeStatus === 'in-progress' ||
            activeRoute.routeStatus === 'completed' ||
            activeRoute.routeStatus === 'refunded' ||
            activeRoute.routeStatus === 'failed')
      ),
    [activeRoutes, activeRouteId]
  )

  if (!WITH_BOTTOM_SHEET.includes(sheetKind)) return null

  return (
    <BottomSheet
      id={`${id}-bottom-sheet`}
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      style={style[sheetKind]}
      type={RENDER_AS_MODAL.includes(sheetKind) ? 'modal' : undefined}
    >
      {sheetKind === 'update-available' && (
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
      {sheetKind === BRIDGE_IN_PROGRESS && (
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

export default memo(DashboardBannerBottomSheet)
