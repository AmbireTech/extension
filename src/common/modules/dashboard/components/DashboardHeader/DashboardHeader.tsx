import React from 'react'
import { Animated, Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BurgerIcon from '@common/assets/svg/BurgerIcon'
import NetworkStatusesIcon from '@common/assets/svg/NetworkStatusIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import { isAmbireNext, isDev } from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexboxStyles from '@common/styles/utils/flexbox'
import useHover from '@web/hooks/useHover'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import commonWebStyles from '@web/styles/utils/common'
import { getUiType } from '@web/utils/uiType'

import NetworkStatusesBottomSheet from '../NetworkStatusesBottomSheet'
import AccountButton from './AccountButton'
import getStyles from './styles'

const { isPopup } = getUiType()

const SHOULD_DISPLAY_NETWORK_STATUSES = isAmbireNext || isDev

const DashboardHeader = () => {
  const { account } = useSelectedAccountControllerState()
  const [bindBurgerAnim, burgerAnimStyle] = useHover({ preset: 'opacity' })
  const [bindReceiveAnim, receiveAnimStyle] = useHover({ preset: 'opacity' })
  const [bindNetworkStatusesAnim, networkStatusesAnimStyle] = useHover({ preset: 'opacity' })
  const { navigate } = useNavigation()
  const { theme, themeType } = useTheme(getStyles)

  const {
    ref: networkStatusesSheetRef,
    open: openNetworkStatusesSheet,
    close: closeNetworkStatusesSheet
  } = useModalize()

  if (!account) return null

  return (
    <View
      style={[
        flexboxStyles.directionRow,
        flexboxStyles.alignCenter,
        flexboxStyles.flex1,
        commonWebStyles.contentContainer
      ]}
    >
      {SHOULD_DISPLAY_NETWORK_STATUSES && (
        <NetworkStatusesBottomSheet
          sheetRef={networkStatusesSheetRef}
          closeBottomSheet={closeNetworkStatusesSheet}
        />
      )}
      <View
        style={[flexboxStyles.directionRow, flexboxStyles.flex1, flexboxStyles.justifySpaceBetween]}
      >
        <View style={[flexboxStyles.directionRow]}>
          <AccountButton />
          <Pressable
            testID="dashboard-button-receive"
            style={[spacings.mlSm, spacings.pvTy, flexboxStyles.alignSelfCenter]}
            onPress={() => navigate(WEB_ROUTES.receive)}
            {...bindReceiveAnim}
          >
            <Animated.View style={receiveAnimStyle}>
              <ReceiveIcon
                color={
                  themeType === THEME_TYPES.DARK
                    ? theme.primaryBackgroundInverted
                    : theme.primaryBackground
                }
                width={25}
                height={25}
              />
            </Animated.View>
          </Pressable>
        </View>
        <View style={[flexboxStyles.directionRow]}>
          {SHOULD_DISPLAY_NETWORK_STATUSES && (
            <Pressable
              style={[spacings.phTy, spacings.pvTy, flexboxStyles.alignSelfCenter]}
              onPress={() => openNetworkStatusesSheet()}
              {...bindNetworkStatusesAnim}
            >
              <Animated.View style={networkStatusesAnimStyle}>
                <NetworkStatusesIcon
                  width={20}
                  height={20}
                  color={
                    themeType === THEME_TYPES.DARK
                      ? theme.primaryBackgroundInverted
                      : theme.primaryBackground
                  }
                />
              </Animated.View>
            </Pressable>
          )}
          <Pressable
            testID="dashboard-hamburger-btn"
            style={[spacings.mlTy, spacings.phTy, spacings.pvTy, flexboxStyles.alignSelfCenter]}
            onPress={() =>
              isPopup ? navigate(WEB_ROUTES.menu) : navigate(WEB_ROUTES.generalSettings)
            }
            {...bindBurgerAnim}
          >
            <Animated.View style={burgerAnimStyle}>
              <BurgerIcon
                color={
                  themeType === THEME_TYPES.DARK
                    ? theme.primaryBackgroundInverted
                    : theme.primaryBackground
                }
                width={20}
                height={20}
              />
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

export default React.memo(DashboardHeader)
