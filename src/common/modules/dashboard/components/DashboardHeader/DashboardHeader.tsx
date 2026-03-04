import React from 'react'
import { Animated, Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BurgerIcon from '@common/assets/svg/BurgerIcon'
import NetworkStatusesIcon from '@common/assets/svg/NetworkStatusIcon'
import { isAmbireNext, isDev } from '@common/config/env'
import useController from '@common/hooks/useController'
import useHover from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import NetworkStatusesBottomSheet from '../NetworkStatusesBottomSheet'
import AccountButton from './AccountButton'

const { isPopup } = getUiType()

const SHOULD_DISPLAY_NETWORK_STATUSES = isAmbireNext || isDev

const DashboardHeader = () => {
  const {
    state: { account }
  } = useController('SelectedAccountController')
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
  } = useModalize()

  if (!account) return null

  return (
    <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, { width: '100%' }]}>
      {SHOULD_DISPLAY_NETWORK_STATUSES && (
        <NetworkStatusesBottomSheet
          sheetRef={networkStatusesSheetRef}
          closeBottomSheet={closeNetworkStatusesSheet}
        />
      )}
      <View style={[flexboxStyles.directionRow, { flex: 1 }, flexboxStyles.justifySpaceBetween]}>
        <AccountButton />
        <View style={[flexboxStyles.directionRow, flexboxStyles.alignStart]}>
          {SHOULD_DISPLAY_NETWORK_STATUSES && (
            <Pressable
              style={[
                flexboxStyles.justifyCenter,
                flexboxStyles.alignCenter,
                {
                  width: 40,
                  height: 40
                }
              ]}
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
              flexboxStyles.justifyCenter,
              flexboxStyles.alignCenter,
              {
                borderRadius: 20,
                width: 40,
                height: 40,
                backgroundColor: '#000000A3'
              }
            ]}
            onPress={() =>
              isPopup ? navigate(WEB_ROUTES.menu) : navigate(WEB_ROUTES.generalSettings)
            }
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
