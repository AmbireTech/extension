import React from 'react'
import { Animated, Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BurgerIcon from '@common/assets/svg/BurgerIcon'
import CloseIcon from '@common/assets/svg/CloseIcon'
import NetworkStatusesIcon from '@common/assets/svg/NetworkStatusIcon'
import { isAmbireNext, isDev, isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import useHover from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInternalPageInTab } from '@common/utils/links/links'
import { getUiType } from '@common/utils/uiType'
import useSidePanelSettingsTab from '@web/hooks/useSidePanelSettingsTab'

import NetworkStatusesBottomSheet from '../NetworkStatusesBottomSheet'
import AccountButton from './AccountButton'

const { isPopup, isSidePanel } = getUiType()

const SHOULD_DISPLAY_NETWORK_STATUSES = isAmbireNext || isDev

const DashboardHeader = () => {
  const { state: account } = useController('SelectedAccountController', 'account')
  const [bindBurgerAnim, burgerAnimStyle] = useHover({ preset: 'opacityInverted', duration: 50 })
  const [bindNetworkStatusesAnim, networkStatusesAnimStyle] = useHover({
    preset: 'opacityInverted',
    duration: 50
  })
  const { navigate } = useNavigation()
  const { isSettingsTabOpen, closeSettingsTab, windowId } = useSidePanelSettingsTab()

  const {
    ref: networkStatusesSheetRef,
    open: openNetworkStatusesSheet,
    close: closeNetworkStatusesSheet
  } = useModalize()

  if (!account) return null

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, { width: '100%' }]}>
      {SHOULD_DISPLAY_NETWORK_STATUSES && (
        <NetworkStatusesBottomSheet
          sheetRef={networkStatusesSheetRef}
          closeBottomSheet={closeNetworkStatusesSheet}
        />
      )}
      <View style={[flexbox.directionRow, flexbox.flex1, flexbox.justifySpaceBetween]}>
        <AccountButton />
        <View style={[flexbox.directionRow, flexbox.alignStart]}>
          {SHOULD_DISPLAY_NETWORK_STATUSES && (
            <Pressable
              style={[flexbox.justifyCenter, flexbox.alignCenter, { width: 40, height: 40 }]}
              onPress={() => openNetworkStatusesSheet()}
              {...bindNetworkStatusesAnim}
            >
              <Animated.View style={networkStatusesAnimStyle}>
                <NetworkStatusesIcon width={20} height={20} color="#FFFFFF" />
              </Animated.View>
            </Pressable>
          )}

          <Pressable
            testID="dashboard-hamburger-btn"
            style={[
              spacings.mlTy,
              flexbox.justifyCenter,
              flexbox.alignCenter,
              {
                borderRadius: 50,
                width: 40,
                height: 40,
                backgroundColor: '#000000A3'
              },
              isMobile && {
                borderWidth: 1,
                borderColor: '#FFFFFF1F'
              }
            ]}
            onPress={() => {
              if (isSidePanel && isSettingsTabOpen) {
                closeSettingsTab()
                return
              }

              if (isSidePanel) {
                openInternalPageInTab({
                  route: WEB_ROUTES.generalSettings,
                  shouldCloseCurrentWindow: false,
                  windowId
                })
                return
              }

              isPopup || isMobile ? navigate(WEB_ROUTES.menu) : navigate(WEB_ROUTES.generalSettings)
            }}
            {...bindBurgerAnim}
          >
            <Animated.View style={burgerAnimStyle}>
              {isSidePanel && isSettingsTabOpen ? (
                <CloseIcon color="#FFFFFF" width={15} height={15} />
              ) : (
                <BurgerIcon color="#FFFFFF" width={28} height={28} />
              )}
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

export default React.memo(DashboardHeader)
