import { BlurView } from 'expo-blur'
import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect } from 'react'
import { View } from 'react-native'

import DAppsIcon from '@common/assets/svg/DAppsIcon'
import DashboardIcon from '@common/assets/svg/DashboardIcon'
import EarnIcon from '@common/assets/svg/EarnIcon'
import SwapIcon from '@common/assets/svg/SwapIcon'
import TransferIcon from '@common/assets/svg/TransferIcon'
import { TAB_BAR_BLUR } from '@common/constants/router'
import { ConnectionStates } from '@common/contexts/netInfoContext'
import useNetInfo from '@common/hooks/useNetInfo'
import useStorageController from '@common/hooks/useStorageController'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import AddAccountPasswordToVaultScreen from '@common/modules/auth/screens/AddAccountPasswordToVaultScreen'
import AuthScreen from '@common/modules/auth/screens/AuthScreen'
import EmailLoginScreen from '@common/modules/auth/screens/EmailLoginScreen'
import ExternalSignerScreen from '@common/modules/auth/screens/ExternalSignerScreen'
import { headerAlpha, headerBeta, headerGamma } from '@common/modules/header/config/headerConfig'
import NoConnectionScreen from '@common/modules/no-connection/screens/NoConnectionScreen'
import routesConfig from '@common/modules/router/config/routesConfig'
import { MOBILE_ROUTES, ROUTES } from '@common/modules/router/constants/common'
import styles, {
  drawerStyle,
  horizontalTabBarLabelStyle,
  tabBarItemStyle,
  tabBarLabelStyle,
  tabBarStyle
} from '@common/modules/router/styles'
import SwapScreen from '@common/modules/swap/screens/SwapScreen'
import { navigate } from '@common/services/navigation'
import colors from '@common/styles/colors'
import { IS_SCREEN_SIZE_L } from '@common/styles/spacings'
import JsonLoginScreen from '@mobile/modules/auth/screens/JsonLoginScreen'
import { OnboardingOnFirstLoginProvider } from '@mobile/modules/dashboard/context/onboardingOnFirstLoginContext'
import useOnboardingOnFirstLogin from '@mobile/modules/dashboard/hooks/useOnboardingOnFirstLogin'
import OnboardingOnFirstLoginScreen from '@mobile/modules/dashboard/screens/OnboardingOnFirstLoginScreen'
import HardwareWalletConnectScreen from '@mobile/modules/hardware-wallet/screens/HardwareWalletConnectScreen'
import SideNavMenu from '@mobile/modules/router/components/SideNavMenu'
import BackupScreen from '@mobile/modules/settings/screens/BackupScreen'
import { DappsProvider } from '@mobile/modules/web3/contexts/dappsContext'
import DappsCatalogScreen from '@mobile/modules/web3/screens/DappsCatalogScreen'
import Web3BrowserScreen from '@mobile/modules/web3/screens/Web3BrowserScreen'
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()
const Drawer = createDrawerNavigator()
const MainStack = createNativeStackNavigator()
const DashboardStack = createNativeStackNavigator()

const ManageVaultLockStack = createNativeStackNavigator()
const Web3Stack = createNativeStackNavigator()
const EmailLoginStack = createNativeStackNavigator()
const JsonLoginStack = createNativeStackNavigator()
const GasTankStack = createNativeStackNavigator()
const GasInformationStack = createNativeStackNavigator()

const BackupStack = createNativeStackNavigator()

const BackupStackScreen = () => {
  return (
    <BackupStack.Navigator screenOptions={{ header: headerGamma }}>
      <BackupStack.Screen
        name={`${MOBILE_ROUTES.backup}-screen`}
        component={BackupScreen}
        options={{
          title: routesConfig[ROUTES.backup].title
        }}
      />
    </BackupStack.Navigator>
  )
}

const GasTankStackScreen = () => {
  return (
    <GasTankStack.Navigator screenOptions={{ header: headerGamma }}>
      <GasTankStack.Screen name={`${MOBILE_ROUTES.gasTank}-screen`} component={GasTankScreen} />
    </GasTankStack.Navigator>
  )
}

const GasInformationStackScreen = () => {
  return (
    <GasInformationStack.Navigator screenOptions={{ header: headerGamma }}>
      <GasInformationStack.Screen
        name={`${MOBILE_ROUTES.gasInformation}-screen`}
        component={GasInformationScreen}
      />
    </GasInformationStack.Navigator>
  )
}

const ManageVaultLockStackScreen = () => {
  return (
    <ManageVaultLockStack.Navigator screenOptions={{ header: headerBeta }}>
      <ManageVaultLockStack.Screen
        name={`${MOBILE_ROUTES.manageVaultLock}-screen`}
        component={ManageVaultLockScreen}
        options={{
          title: routesConfig[ROUTES.manageVaultLock].title
        }}
      />
    </ManageVaultLockStack.Navigator>
  )
}

const Web3StackScreen = () => {
  return (
    <DappsProvider>
      <Web3Stack.Navigator screenOptions={{ headerShown: true }}>
        <Web3Stack.Screen
          name={`${MOBILE_ROUTES.dappsCatalog}-screen`}
          component={DappsCatalogScreen}
          options={{
            title: routesConfig[ROUTES.dappsCatalog].title,
            header: headerAlpha
          }}
        />
        <Web3Stack.Screen
          name={`${MOBILE_ROUTES.web3Browser}-screen`}
          component={Web3BrowserScreen}
          options={{
            title: routesConfig[ROUTES.web3Browser].title,
            header: headerGamma
          }}
        />
      </Web3Stack.Navigator>
    </DappsProvider>
  )
}

const EmailLoginStackScreen = () => {
  return (
    <EmailLoginStack.Navigator screenOptions={{ header: headerBeta }}>
      <EmailLoginStack.Screen
        name={`${MOBILE_ROUTES.ambireAccountLogin}-screen`}
        options={{ title: routesConfig[ROUTES.ambireAccountLogin].title }}
        component={EmailLoginScreen}
      />
      <EmailLoginStack.Screen
        name={MOBILE_ROUTES.ambireAccountLoginPasswordConfirm}
        options={{ title: routesConfig[ROUTES.ambireAccountJsonLoginPasswordConfirm].title }}
        component={AddAccountPasswordToVaultScreen}
      />
    </EmailLoginStack.Navigator>
  )
}

const JsonLoginStackScreen = () => {
  return (
    <JsonLoginStack.Navigator screenOptions={{ header: headerBeta }}>
      <JsonLoginStack.Screen
        name={`${MOBILE_ROUTES.ambireAccountJsonLogin}-screen`}
        options={{ title: routesConfig[ROUTES.ambireAccountJsonLogin].title }}
        component={JsonLoginScreen}
      />
      <JsonLoginStack.Screen
        name={MOBILE_ROUTES.ambireAccountJsonLoginPasswordConfirm}
        options={{
          title: routesConfig[ROUTES.ambireAccountJsonLoginPasswordConfirm].title
        }}
        component={AddAccountPasswordToVaultScreen}
      />
    </JsonLoginStack.Navigator>
  )
}

const AuthStack = () => {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <Stack.Navigator screenOptions={{ header: headerBeta }}>
      <Stack.Screen
        options={{ title: routesConfig[ROUTES.auth].title }}
        name={`${MOBILE_ROUTES.auth}-screen`}
        component={AuthScreen}
      />
      <Stack.Screen
        name={MOBILE_ROUTES.ambireAccountLogin}
        options={{ title: routesConfig[ROUTES.ambireAccountLogin].title, headerShown: false }}
        component={EmailLoginStackScreen}
      />
      <Stack.Screen
        name={MOBILE_ROUTES.ambireAccountJsonLogin}
        options={{
          title: routesConfig[ROUTES.ambireAccountJsonLogin].title,
          headerShown: false
        }}
        component={JsonLoginStackScreen}
      />
      <Stack.Screen
        name={MOBILE_ROUTES.hardwareWallet}
        options={{ title: routesConfig[ROUTES.hardwareWallet].title }}
        component={HardwareWalletConnectScreen}
      />
      <Stack.Screen
        name={MOBILE_ROUTES.externalSigner}
        options={{ title: routesConfig[ROUTES.externalSigner].title }}
        component={ExternalSignerScreen}
      />
    </Stack.Navigator>
  )
}

const NoConnectionStack = () => {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <Stack.Navigator screenOptions={{ header: headerBeta }}>
      <Stack.Screen
        options={{ title: routesConfig[ROUTES.noConnection].title }}
        name={MOBILE_ROUTES.noConnection}
        component={NoConnectionScreen}
      />
    </Stack.Navigator>
  )
}

const DashboardStackScreen = () => {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen
        name={`${MOBILE_ROUTES.dashboard}-screen`}
        component={DashboardScreen}
      />
      <DashboardStack.Screen name={MOBILE_ROUTES.collectible} component={CollectibleScreen} />
    </DashboardStack.Navigator>
  )
}

const TabsScreens = () => {
  const tabsIconSize = IS_SCREEN_SIZE_L ? 44 : 24
  return (
    <Tab.Navigator
      screenOptions={{
        header: headerAlpha,
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
        name={MOBILE_ROUTES.dashboard}
        options={{
          tabBarLabel: routesConfig[ROUTES.dashboard].title,
          headerTitle: routesConfig[ROUTES.dashboard].title,
          tabBarIcon: ({ color }) => (
            <DashboardIcon color={color} width={tabsIconSize} height={tabsIconSize} />
          )
        }}
        component={DashboardStackScreen}
      />
      <Tab.Screen
        name={MOBILE_ROUTES.earn}
        options={{
          tabBarLabel: routesConfig[ROUTES.earn].title,
          headerTitle: routesConfig[ROUTES.earn].title,
          tabBarIcon: ({ color }) => (
            <EarnIcon color={color} width={tabsIconSize} height={tabsIconSize} />
          )
        }}
        component={EarnScreen}
      />
      <Tab.Screen
        name={MOBILE_ROUTES.swap}
        options={{
          tabBarLabel: routesConfig[ROUTES.swap].title,
          headerTitle: routesConfig[ROUTES.swap].title,
          tabBarIcon: ({ color }) => (
            <SwapIcon color={color} width={tabsIconSize} height={tabsIconSize} />
          )
        }}
        component={SwapScreen}
      />
      <Tab.Screen
        name={MOBILE_ROUTES.transactions}
        options={{
          tabBarLabel: routesConfig[ROUTES.transactions].title,
          headerTitle: routesConfig[ROUTES.transactions].title,
          tabBarIcon: ({ color }) => (
            <TransferIcon color={color} width={tabsIconSize} height={tabsIconSize} />
          )
        }}
        component={TransactionsScreen}
      />
      <Tab.Screen
        name={MOBILE_ROUTES.dappsCatalog}
        options={{
          tabBarLabel: routesConfig[ROUTES.dappsCatalog].title,
          headerTitle: routesConfig[ROUTES.dappsCatalog].title,
          headerShown: false,
          tabBarIcon: ({ color }) => (
            // temp icon type and size: tabsIconSize - 6 TODO: replace when redesigning
            <DAppsIcon color={color} width={tabsIconSize - 6} height={tabsIconSize - 6} />
          )
        }}
        component={Web3StackScreen}
      />
    </Tab.Navigator>
  )
}

const AppDrawer = () => {
  return (
    <Drawer.Navigator
      drawerContent={SideNavMenu}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle
      }}
    >
      <Drawer.Screen name="tabs" component={TabsScreens} />
    </Drawer.Navigator>
  )
}

const AppStack = () => {
  const { getItem } = useStorageController()
  const { hasCompletedOnboarding } = useOnboardingOnFirstLogin()

  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  useEffect(() => {
    // Checks whether there is a pending email login attempt. It happens when
    // user requests email login and closes the the app. When the app is opened
    // the second time - an immediate email login attempt will be triggered.
    // Redirect the user instead of using the `initialRouteName`,
    // because when '/auth' is set for `initialRouteName`,
    // the 'drawer' route never gets rendered, and therefore - upon successful
    // login attempt - the redirection to the 'dashboard' route breaks -
    // because this route doesn't exist (it's never being rendered).
    const shouldAttemptLogin = !!getItem('pendingLoginEmail')
    if (shouldAttemptLogin) {
      navigate(MOBILE_ROUTES.auth)
    }

    if (!hasCompletedOnboarding) {
      navigate(MOBILE_ROUTES.onboardingOnFirstLogin)
    }
  }, [getItem, hasCompletedOnboarding])

  return (
    <MainStack.Navigator screenOptions={{ header: headerBeta }}>
      <MainStack.Screen
        name="drawer"
        component={AppDrawer}
        options={{
          headerShown: false
        }}
      />

      <MainStack.Screen
        name={MOBILE_ROUTES.backup}
        component={BackupStackScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        options={{ headerShown: false }}
        name={MOBILE_ROUTES.manageVaultLock}
        component={ManageVaultLockStackScreen}
      />
      <MainStack.Screen
        name={MOBILE_ROUTES.auth}
        component={AuthStack}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name={MOBILE_ROUTES.receive}
        options={{ header: headerGamma }}
        component={ReceiveScreen}
      />
      <MainStack.Screen
        name={MOBILE_ROUTES.send}
        options={{ header: headerGamma }}
        component={SendScreen}
      />
      <MainStack.Screen
        name={MOBILE_ROUTES.provider}
        options={{ title: routesConfig[ROUTES.receive].title }}
        component={ProviderScreen}
      />
      <MainStack.Screen
        name={MOBILE_ROUTES.pendingTransactions}
        component={PendingTransactionsScreen}
        options={{ title: routesConfig[ROUTES.pendingTransactions].title }}
      />
      <MainStack.Screen
        name={MOBILE_ROUTES.signMessage}
        component={SignMessageScreen}
        options={{ title: routesConfig[ROUTES.signMessage].title }}
      />
      <MainStack.Screen
        name={MOBILE_ROUTES.gasTank}
        component={GasTankStackScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name={MOBILE_ROUTES.gasInformation}
        component={GasInformationStackScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name={MOBILE_ROUTES.onboardingOnFirstLogin}
        component={OnboardingOnFirstLoginScreen}
        options={{ headerShown: false }}
      />
    </MainStack.Navigator>
  )
}

const Router = () => {
  const { authStatus } = useAuth()
  const { connectionState } = useNetInfo()

  if (connectionState === ConnectionStates.NOT_CONNECTED) {
    return <NoConnectionStack />
  }

  // When not authenticated, take him to the Auth screens first,
  // even without having a vault initialized yet.
  if (authStatus === AUTH_STATUS.NOT_AUTHENTICATED) {
    return <AuthStack />
  }

  if (authStatus === AUTH_STATUS.AUTHENTICATED) {
    return (
      <OnboardingOnFirstLoginProvider>
        <AppStack />
      </OnboardingOnFirstLoginProvider>
    )
  }

  // authStatus === AUTH_STATUS.LOADING or anything else:
  return null
}

export default Router
