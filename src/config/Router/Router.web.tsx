import * as SplashScreen from 'expo-splash-screen'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import DashboardIcon from '@assets/svg/DashboardIcon'
import EarnIcon from '@assets/svg/EarnIcon'
import GasTankIcon from '@assets/svg/GasTankIcon'
import SendIcon from '@assets/svg/SendIcon'
import SwapIcon from '@assets/svg/SwapIcon'
import TransferIcon from '@assets/svg/TransferIcon'
import DrawerContent from '@config/Router/DrawerContent'
import {
  headerAlpha as defaultHeaderAlpha,
  headerBeta as defaultHeaderBeta,
  headerGamma as defaultHeaderGamma
} from '@config/Router/HeadersConfig'
import styles, { tabBarItemWebStyle, tabBarLabelStyle, tabBarWebStyle } from '@config/Router/styles'
import { AUTH_STATUS } from '@modules/auth/constants/authStatus'
import { EmailLoginProvider } from '@modules/auth/contexts/emailLoginContext'
import { JsonLoginProvider } from '@modules/auth/contexts/jsonLoginContext'
import useAuth from '@modules/auth/hooks/useAuth'
import AddAccountPasswordToVaultScreen from '@modules/auth/screens/AddAccountPasswordToVaultScreen'
import AuthScreen from '@modules/auth/screens/AuthScreen'
import EmailLoginScreen from '@modules/auth/screens/EmailLoginScreen'
import ExternalSignerScreen from '@modules/auth/screens/ExternalSignerScreen'
import JsonLoginScreen from '@modules/auth/screens/JsonLoginScreen'
import QRCodeLoginScreen from '@modules/auth/screens/QRCodeLoginScreen'
import Spinner from '@modules/common/components/Spinner'
import { ConnectionStates } from '@modules/common/contexts/netInfoContext'
import useExtensionApproval from '@modules/common/hooks/useExtensionApproval'
import useNetInfo from '@modules/common/hooks/useNetInfo'
import useStorageController from '@modules/common/hooks/useStorageController'
import NoConnectionScreen from '@modules/common/screens/NoConnectionScreen'
import { navigate, navigationRef, routeNameRef } from '@modules/common/services/navigation'
import colors from '@modules/common/styles/colors'
import flexbox from '@modules/common/styles/utils/flexbox'
import ConnectScreen from '@modules/connect/screens/ConnectScreen'
import CollectibleScreen from '@modules/dashboard/screens/CollectibleScreen'
import DashboardScreen from '@modules/dashboard/screens/DashboardScreen'
import EarnScreen from '@modules/earn/screens/EarnScreen'
import PermissionRequestScreen from '@modules/extension/screens/PermissionRequestScreen'
import SwitchNetworkRequestScreen from '@modules/extension/screens/SwitchNetworkRequestScreen'
import WatchTokenRequestScreen from '@modules/extension/screens/WatchTokenRequestScreen'
import GasInformationScreen from '@modules/gas-tank/screens/GasInformationScreen'
import GasTankScreen from '@modules/gas-tank/screens/GasTankScreen'
import HardwareWalletConnectScreen from '@modules/hardware-wallet/screens/HardwareWalletConnectScreen'
import PendingTransactionsScreen from '@modules/pending-transactions/screens/PendingTransactionsScreen'
import ProviderScreen from '@modules/receive/screens/ProviderScreen'
import ReceiveScreen from '@modules/receive/screens/ReceiveScreen'
import SendScreen from '@modules/send/screens/SendScreen'
import SignersScreen from '@modules/settings/screens/SignersScreen'
import SignMessageScreen from '@modules/sign-message/screens/SignMessageScreen'
import SwapScreen from '@modules/swap/screens/SwapScreen'
import TransactionsScreen from '@modules/transactions/screens/TransactionsScreen'
import { VAULT_STATUS } from '@modules/vault/constants/vaultStatus'
import useVault from '@modules/vault/hooks/useVault'
import CreateNewVaultScreen from '@modules/vault/screens/CreateNewVaultScreen'
import ResetVaultScreen from '@modules/vault/screens/ResetVaultScreen'
import UnlockVaultScreen from '@modules/vault/screens/UnlockVaultScreen'
import VaultSetupGetStartedScreen from '@modules/vault/screens/VaultSetupGetStartedScreen'
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { getUiType } from '@web/utils/uiType'

import { drawerWebStyle, navigationContainerDarkTheme } from './styles'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()
const Drawer = createDrawerNavigator()
const MainStack = createNativeStackNavigator()
const DashboardStack = createNativeStackNavigator()
const SignersStack = createNativeStackNavigator()
const EmailLoginStack = createNativeStackNavigator()
const JsonLoginStack = createNativeStackNavigator()
const GasTankStack = createNativeStackNavigator()
const GasInformationStack = createNativeStackNavigator()

const navigationEnabled = !getUiType().isNotification

const headerAlpha = navigationEnabled
  ? (props: any) => defaultHeaderAlpha({ ...props, backgroundColor: colors.martinique })
  : defaultHeaderBeta
const headerBeta = navigationEnabled ? defaultHeaderBeta : defaultHeaderBeta
const headerGamma = navigationEnabled
  ? (props: any) => defaultHeaderGamma({ ...props, backgroundColor: colors.martinique })
  : defaultHeaderBeta

const SignersStackScreen = () => {
  const { t } = useTranslation()

  return (
    <SignersStack.Navigator screenOptions={{ header: headerGamma }}>
      <SignersStack.Screen
        name="signers-screen"
        component={SignersScreen}
        options={{
          title: t('Manage Signers')
        }}
      />
    </SignersStack.Navigator>
  )
}

const GasTankStackScreen = () => {
  return (
    <GasTankStack.Navigator screenOptions={{ header: headerGamma }}>
      <GasTankStack.Screen name="gas-tank-screen" component={GasTankScreen} />
    </GasTankStack.Navigator>
  )
}

const GasInformationStackScreen = () => {
  return (
    <GasInformationStack.Navigator screenOptions={{ header: headerGamma }}>
      <GasInformationStack.Screen name="gas-information-screen" component={GasInformationScreen} />
    </GasInformationStack.Navigator>
  )
}

const EmailLoginStackScreen = () => {
  const { t } = useTranslation()

  return (
    <EmailLoginProvider>
      <EmailLoginStack.Navigator screenOptions={{ header: headerBeta }}>
        <EmailLoginStack.Screen
          name="emailLogin"
          options={{ title: t('Login') }}
          component={EmailLoginScreen}
        />
        <EmailLoginStack.Screen
          name="addAccountPasswordToVault"
          options={{ title: t('Login') }}
          component={AddAccountPasswordToVaultScreen}
        />
      </EmailLoginStack.Navigator>
    </EmailLoginProvider>
  )
}

const JsonLoginStackScreen = () => {
  const { t } = useTranslation()

  return (
    <JsonLoginProvider>
      <JsonLoginStack.Navigator screenOptions={{ header: headerBeta }}>
        <JsonLoginStack.Screen
          name="jsonLogin"
          options={{ title: t('Import from JSON') }}
          component={JsonLoginScreen}
        />
        <JsonLoginStack.Screen
          name="addAccountPasswordToVault"
          options={{ title: t('Login') }}
          component={AddAccountPasswordToVaultScreen}
        />
      </JsonLoginStack.Navigator>
    </JsonLoginProvider>
  )
}

const AuthStack = () => {
  const { t } = useTranslation()
  const { getItem } = useStorageController()
  const { vaultStatus } = useVault()

  useEffect(() => {
    if (vaultStatus !== VAULT_STATUS.LOADING) {
      SplashScreen.hideAsync()
    }
  }, [vaultStatus])

  if (vaultStatus === VAULT_STATUS.LOADING) return null

  const initialRouteName =
    vaultStatus === VAULT_STATUS.NOT_INITIALIZED
      ? 'createVaultGetStarted'
      : // Checks whether there is a pending email login attempt. It happens when user
      // request email login and closes the app. When the app is opened
      // the second time - an immediate email login attempt will be triggered.
      getItem('pendingLoginEmail')
      ? 'ambireAccountLogin'
      : 'auth'

  return (
    <Stack.Navigator screenOptions={{ header: headerBeta }} initialRouteName={initialRouteName}>
      {vaultStatus === VAULT_STATUS.NOT_INITIALIZED && (
        <>
          <Stack.Screen
            name="createVaultGetStarted"
            options={{ title: t('Welcome') }}
            component={VaultSetupGetStartedScreen}
          />
          <Stack.Screen
            name="createVault"
            options={{ title: t('Setup Your Ambire Key Store') }}
            component={CreateNewVaultScreen}
          />
        </>
      )}
      <Stack.Screen
        options={{ title: t('Welcome to\nAmbire Wallet Extension') }}
        name="auth"
        component={AuthScreen}
      />
      <Stack.Screen
        name="ambireAccountLogin"
        options={{ title: t('Login'), headerShown: false }}
        component={EmailLoginStackScreen}
      />
      <Stack.Screen
        name="ambireAccountJsonLogin"
        options={{ title: t('Import from JSON'), headerShown: false }}
        component={JsonLoginStackScreen}
      />
      <Stack.Screen
        name="qrCodeLogin"
        options={{ title: t('Import with QR Code') }}
        component={QRCodeLoginScreen}
      />
      <Stack.Screen
        name="hardwareWallet"
        options={{ title: t('Hardware Wallet') }}
        component={HardwareWalletConnectScreen}
      />
      <Stack.Screen
        name="externalSigner"
        options={{ title: t('Login with External Signer') }}
        component={ExternalSignerScreen}
      />
    </Stack.Navigator>
  )
}

const NoConnectionStack = () => {
  const { t } = useTranslation()
  const { vaultStatus } = useVault()

  useEffect(() => {
    if (vaultStatus !== VAULT_STATUS.LOADING) {
      SplashScreen.hideAsync()
    }
  }, [vaultStatus])

  return (
    <Stack.Navigator screenOptions={{ header: headerBeta }}>
      <Stack.Screen
        options={{ title: t('No connection') }}
        name="no-connection"
        component={NoConnectionScreen}
      />
    </Stack.Navigator>
  )
}

const VaultStack = () => {
  const { t } = useTranslation()
  const { vaultStatus, unlockVault, resetVault, biometricsEnabled } = useVault()

  useEffect(() => {
    if (vaultStatus !== VAULT_STATUS.LOADING) {
      SplashScreen.hideAsync()
    }
  }, [vaultStatus])

  if (vaultStatus === VAULT_STATUS.LOADING) return null

  return (
    <Stack.Navigator screenOptions={{ header: headerBeta }} initialRouteName="unlockVault">
      <Stack.Screen name="unlockVault" options={{ title: t('Welcome Back') }}>
        {(props) => (
          <UnlockVaultScreen
            {...props}
            unlockVault={unlockVault}
            vaultStatus={vaultStatus}
            biometricsEnabled={biometricsEnabled}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="resetVault" options={{ title: t('Reset your\nAmbire Key Store Lock') }}>
        {(props) => (
          <ResetVaultScreen {...props} vaultStatus={vaultStatus} resetVault={resetVault} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  )
}

const PermissionRequestStack = () => {
  const { t } = useTranslation()

  const { vaultStatus } = useVault()

  useEffect(() => {
    if (vaultStatus !== VAULT_STATUS.LOADING) {
      SplashScreen.hideAsync()
    }
  }, [vaultStatus])

  return (
    <Stack.Navigator
      screenOptions={{ header: (props) => headerBeta({ ...props, backgroundColor: colors.wooed }) }}
    >
      <Stack.Screen
        options={{ title: t('Permission Request') }}
        name="permission-request"
        component={PermissionRequestScreen}
      />
    </Stack.Navigator>
  )
}
const SwitchNetworkRequestStack = () => {
  const { t } = useTranslation()
  const { vaultStatus } = useVault()

  useEffect(() => {
    if (vaultStatus !== VAULT_STATUS.LOADING) {
      SplashScreen.hideAsync()
    }
  }, [vaultStatus])

  return (
    <Stack.Navigator
      screenOptions={{ header: (props) => headerBeta({ ...props, backgroundColor: colors.wooed }) }}
    >
      <Stack.Screen
        options={{ title: t('Switch Network Request') }}
        name="switch-network-request"
        component={SwitchNetworkRequestScreen}
      />
    </Stack.Navigator>
  )
}

const WatchTokenRequestStack = () => {
  const { t } = useTranslation()
  const { vaultStatus } = useVault()

  useEffect(() => {
    if (vaultStatus !== VAULT_STATUS.LOADING) {
      SplashScreen.hideAsync()
    }
  }, [vaultStatus])

  return (
    <Stack.Navigator
      screenOptions={{ header: (props) => headerBeta({ ...props, backgroundColor: colors.wooed }) }}
    >
      <Stack.Screen
        options={{ title: t('Watch Token Request') }}
        name="watch-token-request"
        component={WatchTokenRequestScreen}
      />
    </Stack.Navigator>
  )
}

const PendingTransactionsStack = () => {
  const { t } = useTranslation()

  const { vaultStatus } = useVault()

  useEffect(() => {
    if (vaultStatus !== VAULT_STATUS.LOADING) {
      SplashScreen.hideAsync()
    }
  }, [vaultStatus])

  return (
    <Stack.Navigator screenOptions={{ header: headerBeta }}>
      <Stack.Screen
        options={{ title: t('Pending Transactions') }}
        name="pending-transactions"
        component={PendingTransactionsScreen}
      />
    </Stack.Navigator>
  )
}

const SignMessageStack = () => {
  const { t } = useTranslation()

  const { vaultStatus } = useVault()

  useEffect(() => {
    if (vaultStatus !== VAULT_STATUS.LOADING) {
      SplashScreen.hideAsync()
    }
  }, [vaultStatus])

  return (
    <Stack.Navigator screenOptions={{ header: headerBeta }}>
      <Stack.Screen
        options={{ title: t('SignMessage') }}
        name="sign-message"
        component={SignMessageScreen}
      />
    </Stack.Navigator>
  )
}

const DashboardStackScreen = () => {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="dashboard-screen" component={DashboardScreen} />
      <DashboardStack.Screen name="collectible-screen" component={CollectibleScreen} />
    </DashboardStack.Navigator>
  )
}

const TabsScreens = () => {
  const { t } = useTranslation()

  const tabsIconSize = 34

  return (
    <Tab.Navigator
      screenOptions={{
        header: headerAlpha,
        tabBarActiveTintColor: colors.heliotrope,
        tabBarInactiveTintColor: colors.titan,
        tabBarActiveBackgroundColor: colors.howl_65,
        tabBarStyle: tabBarWebStyle,
        tabBarLabelStyle,
        tabBarItemStyle: tabBarItemWebStyle
      }}
      tabBar={(props: any) =>
        !!navigationEnabled && (
          <View style={[styles.tabBarContainerWeb]}>
            <View style={[styles.backdropBlurWrapper]}>
              <View style={{ paddingBottom: props.insets.bottom }}>
                <BottomTabBar {...props} insets={{ bottom: 0 }} />
              </View>
            </View>
          </View>
        )
      }
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
        component={DashboardStackScreen}
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
      <Tab.Screen
        name="gas-tank"
        options={{
          tabBarLabel: t('Gas Tank'),
          headerTitle: t('Gas Tank'),
          tabBarIcon: ({ color }) => (
            <GasTankIcon color={color} width={tabsIconSize} height={tabsIconSize} />
          )
        }}
        component={GasTankScreen}
      />
    </Tab.Navigator>
  )
}

const AppDrawer = () => {
  // Should never proceed to the main app drawer if it's a notification (popup),
  // because these occurrences are only used to prompt specific actions.
  if (getUiType().isNotification) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.center]}>
        <Spinner />
      </View>
    )
  }

  return (
    <Drawer.Navigator
      drawerContent={navigationEnabled ? DrawerContent : () => null}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: drawerWebStyle,
        drawerPosition: 'right'
      }}
    >
      <Drawer.Screen name="tabs" component={TabsScreens} />
    </Drawer.Navigator>
  )
}

const AppStack = () => {
  const { t } = useTranslation()
  const { getItem } = useStorageController()

  const { vaultStatus } = useVault()

  useEffect(() => {
    if (vaultStatus !== VAULT_STATUS.LOADING) {
      SplashScreen.hideAsync()
    }
  }, [vaultStatus])

  useEffect(() => {
    // Checks whether there is a pending email login attempt. It happens when
    // user requests email login and closes the the app. When the app is opened
    // the second time - an immediate email login attempt will be triggered.
    // Redirect the user instead of using the `initialRouteName`,
    // because when 'auth-add-account' is set for `initialRouteName`,
    // the 'drawer' route never gets rendered, and therefore - upon successful
    // login attempt - the redirection to the 'dashboard' route breaks -
    // because this route doesn't exist (it's never being rendered).
    const shouldAttemptLogin = !!getItem('pendingLoginEmail')
    if (shouldAttemptLogin) {
      navigate('auth-add-account')
    }
  }, [getItem])

  return (
    <MainStack.Navigator screenOptions={{ header: headerBeta }} initialRouteName="drawer">
      <MainStack.Screen
        name="drawer"
        component={AppDrawer}
        options={{
          headerShown: false
        }}
      />
      <MainStack.Screen
        options={{ headerShown: false }}
        name="signers"
        component={SignersStackScreen}
      />
      <MainStack.Screen
        name="auth-add-account"
        component={AuthStack}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="permission-request"
        component={PermissionRequestStack}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="connect"
        component={ConnectScreen}
        options={{ title: t('Connect a dApp') }}
      />
      <MainStack.Screen
        name="receive"
        options={{ header: headerGamma }}
        component={ReceiveScreen}
      />
      <MainStack.Screen
        name="provider"
        options={{ title: t('Receive') }}
        component={ProviderScreen}
      />
      <MainStack.Screen
        name="pending-transactions"
        component={PendingTransactionsScreen}
        options={{ title: t('Pending Transaction') }}
      />
      <MainStack.Screen
        name="sign-message"
        component={SignMessageScreen}
        options={{ title: t('Sign'), headerLeft: () => null, gestureEnabled: false }}
      />
      <MainStack.Screen
        name="gas-tank"
        component={GasTankStackScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="gas-information"
        component={GasInformationStackScreen}
        options={{ headerShown: false }}
      />
    </MainStack.Navigator>
  )
}

const Router = () => {
  const { authStatus } = useAuth()
  const { vaultStatus } = useVault()
  const { connectionState } = useNetInfo()
  const { approval, hasCheckedForApprovalInitially } = useExtensionApproval()
  const isInNotification = getUiType().isNotification

  const renderContent = useCallback(() => {
    if (!hasCheckedForApprovalInitially)
      return (
        <View style={[StyleSheet.absoluteFill, flexbox.center]}>
          <Spinner />
        </View>
      )

    if (isInNotification && !approval) {
      window.close()
      return null
    }

    if (connectionState === ConnectionStates.NOT_CONNECTED) {
      return <NoConnectionStack />
    }

    // Vault loads in async manner, so always wait until it's being loaded,
    // otherwise - other routes flash beforehand.
    if (vaultStatus === VAULT_STATUS.LOADING) return null

    // When locked, always prompt the user to unlock it first.
    if (VAULT_STATUS.LOCKED === vaultStatus) {
      return <VaultStack />
    }

    // When not authenticated, take him to the Auth screens first,
    // even without having a vault initialized yet.
    if (authStatus === AUTH_STATUS.NOT_AUTHENTICATED) {
      return <AuthStack />
    }

    if (authStatus === AUTH_STATUS.AUTHENTICATED) {
      if (VAULT_STATUS.NOT_INITIALIZED === vaultStatus) {
        return <VaultStack />
      }

      if (approval?.data?.approvalComponent === 'permission-request') {
        return <PermissionRequestStack />
      }
      if (approval?.data?.approvalComponent === 'send-txn') {
        return <PendingTransactionsStack />
      }
      if (approval?.data?.approvalComponent === 'SignText') {
        return <SignMessageStack />
      }
      if (approval?.data?.approvalComponent === 'SignTypedData') {
        return <SignMessageStack />
      }
      if (approval?.data?.approvalComponent === 'switch-network') {
        return <SwitchNetworkRequestStack />
      }
      if (approval?.data?.approvalComponent === 'wallet_watchAsset') {
        return <WatchTokenRequestStack />
      }

      if (vaultStatus === VAULT_STATUS.UNLOCKED) {
        return <AppStack />
      }
    }

    return null
  }, [
    hasCheckedForApprovalInitially,
    isInNotification,
    approval,
    connectionState,
    vaultStatus,
    authStatus
  ])

  const handleOnReady = () => {
    // @ts-ignore for some reason TS complains about this 👇
    routeNameRef.current = navigationRef.current.getCurrentRoute()?.name
  }

  return (
    <NavigationContainer
      // Part of the mechanism for being able to navigate without the navigation prop.
      // For more details, see the NavigationService.
      ref={navigationRef}
      onReady={handleOnReady}
      theme={navigationContainerDarkTheme}
    >
      {renderContent()}
    </NavigationContainer>
  )
}

export default Router
