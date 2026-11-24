import React from 'react'
import { Animated, Pressable, View } from 'react-native'

import BurgerIcon from '@common/assets/svg/BurgerIcon'
import NetworkStatusesIcon from '@common/assets/svg/NetworkStatusIcon'
import useSheetRef from '@common/components/BottomSheet/useSheetRef'
import { isAmbireNext, isDev, isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import useHover from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import NetworkStatusesBottomSheet from '../NetworkStatusesBottomSheet'
import AccountButton from './AccountButton'
import { DASHBOARD_HEADER_BUTTON_SIZE, ROUND_BUTTON_STYLE } from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const { isPopup } = getUiType()

const SHOULD_DISPLAY_NETWORK_STATUSES = isAmbireNext || isDev

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

const DashboardHeader = () => {
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const [bindBurgerAnim, burgerAnimStyle] = useHover({ preset: 'opacityInverted', duration: 50 })
  const [bindNetworkStatusesAnim, networkStatusesAnimStyle] = useHover({
    preset: 'opacityInverted',
    duration: 50
  })
  const { navigate } = useNavigation()

  const {
    ref: networkStatusesSheetRef,
    open: openNetworkStatusesSheet,
    close: closeNetworkStatusesSheet
  } = useSheetRef()

  if (!account) return null

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, { width: '100%' }]}>
      {SHOULD_DISPLAY_NETWORK_STATUSES && (
        <NetworkStatusesBottomSheet
          sheetRef={networkStatusesSheetRef}
          closeBottomSheet={closeNetworkStatusesSheet}
        />
      )}
      <View
        style={[
          flexbox.directionRow,
          flexbox.flex1,
          flexbox.justifySpaceBetween,
          { gap: SPACING_TY }
        ]}
      >
        <AccountButton height={DASHBOARD_HEADER_BUTTON_SIZE} isExpanded />
        <View style={[flexbox.directionRow, flexbox.alignStart, { gap: SPACING_TY }]}>
          {SHOULD_DISPLAY_NETWORK_STATUSES && (
            <Pressable
              style={ROUND_BUTTON_STYLE}
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
            style={ROUND_BUTTON_STYLE}
            onPress={() => {
              isPopup || isMobile ? navigate(ROUTES.menu) : navigate(WEB_ROUTES.generalSettings)
            }}
            {...bindBurgerAnim}
          >
            <Animated.View style={burgerAnimStyle}>
              <BurgerIcon color="#FFFFFF" width={28} height={28} />
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

export default React.memo(DashboardHeader)
