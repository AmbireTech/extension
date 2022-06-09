import { BlurView } from 'expo-blur'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import DashboardIcon from '@assets/svg/DashboardIcon'
import EarnIcon from '@assets/svg/EarnIcon'
import SendIcon from '@assets/svg/SendIcon'
// import SwapIcon from '@assets/svg/SwapIcon'
import TransferIcon from '@assets/svg/TransferIcon'
import HeaderBottomSheet from '@config/Router/Header/HeaderBottomSheet'
import { headerAlpha } from '@config/Router/HeadersConfig'
import styles, {
  horizontalTabBarLabelStyle,
  tabBarItemStyle,
  tabBarLabelStyle,
  tabBarStyle
} from '@config/Router/styles'
import useBottomSheet from '@modules/common/components/BottomSheet/hooks/useBottomSheet'
import { TAB_BAR_BLUR } from '@modules/common/constants/router'
import { colorPalette as colors } from '@modules/common/styles/colors'
import { IS_SCREEN_SIZE_L } from '@modules/common/styles/spacings'
import DashboardScreen from '@modules/dashboard/screens/DashboardScreen'
import EarnScreen from '@modules/earn/screens/EarnScreen'
import SendScreen from '@modules/send/screens/SendScreen'
// import SwapScreen from '@modules/swap/screens/SwapScreen'
import TransactionsScreen from '@modules/transactions/screens/TransactionsScreen'
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs'

const Tab = createBottomTabNavigator()

const TabsScreens = () => {
  const { t } = useTranslation()
  // We need the bottom sheet defined globally (not in the Header component)
  // Otherwise there are multiple instances of the same bottom sheet that interfere with each other cause react navigation
  // passes new Header component to each screen
  const { sheetRef, isOpen, closeBottomSheet, openBottomSheet } = useBottomSheet()

  const tabsIconSize = IS_SCREEN_SIZE_L ? 44 : 24
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          header: (props) => headerAlpha({ ...props, openBottomSheet }),
          tabBarActiveTintColor: colors.heliotrope,
          tabBarInactiveTintColor: colors.titan,
          tabBarActiveBackgroundColor: colors.howl_65,
          tabBarStyle,
          tabBarLabelStyle: IS_SCREEN_SIZE_L ? horizontalTabBarLabelStyle : tabBarLabelStyle,
          tabBarItemStyle
        }}
        tabBar={(props: any) => (
          <View style={[styles.tabBarContainer]}>
            <BlurView intensity={TAB_BAR_BLUR} tint="dark" style={[styles.backdropBlurWrapper]}>
              <View style={{ paddingBottom: props.insets.bottom }}>
                <BottomTabBar {...props} insets={{ bottom: 0 }} />
              </View>
            </BlurView>
          </View>
        )}
      >
        <Tab.Screen
          name="dashboard"
          options={{
            tabBarLabel: t('Dashboard'),
            headerTitle: t('Dashboard'),
            tabBarIcon: ({ color }) => (
              <DashboardIcon color={color} width={tabsIconSize} height={tabsIconSize} />
            )
          }}
          component={DashboardScreen}
        />
        <Tab.Screen
          name="earn"
          options={{
            tabBarLabel: t('Earn'),
            headerTitle: t('Earn'),
            tabBarIcon: ({ color }) => (
              <EarnIcon color={color} width={tabsIconSize} height={tabsIconSize} />
            )
          }}
          component={EarnScreen}
        />
        <Tab.Screen
          name="send"
          options={{
            tabBarLabel: t('Send'),
            headerTitle: t('Send'),
            tabBarIcon: ({ color }) => (
              <SendIcon color={color} width={tabsIconSize} height={tabsIconSize} />
            )
          }}
          component={SendScreen}
        />
        {/* TODO: Temporary disabled since v1.6.0 as part of the Apple app review feedback */}
        {/* <Tab.Screen
      name="swap"
      options={{
        tabBarLabel: t('Swap'),
        headerTitle: t('Swap'),
        tabBarIcon: ({ color }) => (
          <SwapIcon color={color} width={tabsIconSize} height={tabsIconSize} />
        )
      }}
      component={SwapScreen}
    /> */}
        <Tab.Screen
          name="transactions"
          options={{
            tabBarLabel: t('Transactions'),
            headerTitle: t('Transactions'),
            tabBarIcon: ({ color }) => (
              <TransferIcon color={color} width={tabsIconSize} height={tabsIconSize} />
            )
          }}
          component={TransactionsScreen}
        />
      </Tab.Navigator>
      <HeaderBottomSheet sheetRef={sheetRef} isOpen={isOpen} closeBottomSheet={closeBottomSheet} />
    </View>
  )
}

export default React.memo(TabsScreens)
