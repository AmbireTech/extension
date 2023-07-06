import { BlurView } from 'expo-blur'
import * as SplashScreen from 'expo-splash-screen'
import React, { useCallback, useEffect } from 'react'
import { View } from 'react-native'

import DAppsIcon from '@common/assets/svg/DAppsIcon'
import DashboardIcon from '@common/assets/svg/DashboardIcon'
import EarnIcon from '@common/assets/svg/EarnIcon'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import SwapIcon from '@common/assets/svg/SwapIcon'
import TransferIcon from '@common/assets/svg/TransferIcon'
import Text from '@common/components/Text'
import { TAB_BAR_BLUR } from '@common/constants/router'
import { ConnectionStates } from '@common/contexts/netInfoContext'
import useNetInfo from '@common/hooks/useNetInfo'
import useRequests from '@common/hooks/useRequests'
import useStorageController from '@common/hooks/useStorageController'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import { EmailLoginProvider } from '@common/modules/auth/contexts/emailLoginContext'
import { JsonLoginProvider } from '@common/modules/auth/contexts/jsonLoginContext'
import useAuth from '@common/modules/auth/hooks/useAuth'
import AddAccountPasswordToVaultScreen from '@common/modules/auth/screens/AddAccountPasswordToVaultScreen'
import AuthScreen from '@common/modules/auth/screens/AuthScreen'
import EmailLoginScreen from '@common/modules/auth/screens/EmailLoginScreen'
import ExternalSignerScreen from '@common/modules/auth/screens/ExternalSignerScreen'
import CollectibleScreen from '@common/modules/dashboard/screens/CollectibleScreen'
import DashboardScreen from '@common/modules/dashboard/screens/DashboardScreen'
import EarnScreen from '@common/modules/earn/screens/EarnScreen'
import GasInformationScreen from '@common/modules/gas-tank/screens/GasInformationScreen'
import GasTankScreen from '@common/modules/gas-tank/screens/GasTankScreen'
import { headerAlpha, headerBeta, headerGamma } from '@common/modules/header/config/headerConfig'
import NoConnectionScreen from '@common/modules/no-connection/screens/NoConnectionScreen'
import { PendingTransactionsProvider } from '@common/modules/pending-transactions/contexts/pendingTransactionsContext'
import PendingTransactionsScreen from '@common/modules/pending-transactions/screens/PendingTransactionsScreen'
import ProviderScreen from '@common/modules/receive/screens/ProviderScreen'
import ReceiveScreen from '@common/modules/receive/screens/ReceiveScreen'
import routesConfig from '@common/modules/router/config/routesConfig'
import { MOBILE_ROUTES, ROUTES } from '@common/modules/router/constants/common'
import styles, {
  drawerStyle,
  horizontalTabBarLabelStyle,
  tabBarItemStyle,
  tabBarLabelStyle,
  tabBarStyle
} from '@common/modules/router/styles'
import SendScreen from '@common/modules/send/screens/SendScreen'
import DataDeletionPolicyScreen from '@common/modules/settings/screens/DataDeletionPolicyScreen'
import DisableOtp2FaScreen from '@common/modules/settings/screens/DisableOtp2FaScreen'
import EnableOtp2FaScreen from '@common/modules/settings/screens/EnableOtp2FaScreen'
import SignersScreen from '@common/modules/settings/screens/SignersScreen'
import SignMessageScreen from '@common/modules/sign-message/screens/SignMessageScreen'
import SwapScreen from '@common/modules/swap/screens/SwapScreen'
import TransactionsScreen from '@common/modules/transactions/screens/TransactionsScreen'
import { VAULT_STATUS } from '@common/modules/vault/constants/vaultStatus'
import useVault from '@common/modules/vault/hooks/useVault'
import CreateNewVaultScreen from '@common/modules/vault/screens/CreateNewVaultScreen'
import ManageVaultLockScreen from '@common/modules/vault/screens/ManageVaultLockScreen'
import ResetVaultScreen from '@common/modules/vault/screens/ResetVaultScreen'
import UnlockVaultScreen from '@common/modules/vault/screens/UnlockVaultScreen'
import VaultSetupGetStartedScreen from '@common/modules/vault/screens/VaultSetupGetStartedScreen'
import { navigate } from '@common/services/navigation'
import colors from '@common/styles/colors'
import { IS_SCREEN_SIZE_L } from '@common/styles/spacings'
import JsonLoginScreen from '@mobile/modules/auth/screens/JsonLoginScreen'
import { OnboardingOnFirstLoginProvider } from '@mobile/modules/dashboard/context/onboardingOnFirstLoginContext'
import useOnboardingOnFirstLogin from '@mobile/modules/dashboard/hooks/useOnboardingOnFirstLogin'
import OnboardingOnFirstLoginScreen from '@mobile/modules/dashboard/screens/OnboardingOnFirstLoginScreen'
import HardwareWalletConnectScreen from '@mobile/modules/hardware-wallet/screens/HardwareWalletConnectScreen'
import AddReferralScreen from '@mobile/modules/referral/screens/AddReferralScreen'
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
const SignersStack = createNativeStackNavigator()
const ManageVaultLockStack = createNativeStackNavigator()
const Web3Stack = createNativeStackNavigator()
const EmailLoginStack = createNativeStackNavigator()
const JsonLoginStack = createNativeStackNavigator()
const EarnStack = createNativeStackNavigator()
const GasInformationStack = createNativeStackNavigator()
const DataDeletionPolicyStack = createNativeStackNavigator()
const BackupStack = createNativeStackNavigator()

const SignersStackScreen = () => {
  return (
    <SignersStack.Navigator screenOptions={{ header: headerGamma }}>
      <SignersStack.Screen
        name={`${MOBILE_ROUTES.signers}-screen`}
        component={SignersScreen}
        options={{
          title: routesConfig[ROUTES.signers].title
        }}
      />
      <SignersStack.Screen
        name={MOBILE_ROUTES.enableOtp2FA}
        component={EnableOtp2FaScreen}
        options={{
          title: routesConfig[ROUTES.enableOtp2FA].title,
          header: headerBeta
        }}
      />
      <SignersStack.Screen
        name={MOBILE_ROUTES.disableOtp2FA}
        component={DisableOtp2FaScreen}
        options={{
          title: routesConfig[ROUTES.disableOtp2FA].title,
          header: headerBeta
        }}
      />
    </SignersStack.Navigator>
  )
}

const DataDeletionPolicyStackScreen = () => {
  return (
    <DataDeletionPolicyStack.Navigator screenOptions={{ header: headerBeta }}>
      <DataDeletionPolicyStack.Screen
        name={`${MOBILE_ROUTES.dataDeletionPolicy}-screen`}
        component={DataDeletionPolicyScreen}
        options={{
          title: routesConfig[ROUTES.dataDeletionPolicy].title
        }}
      />
    </DataDeletionPolicyStack.Navigator>
  )
}

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

const EarnStackScreen = () => {
  return (
    <EarnStack.Navigator screenOptions={{ header: headerGamma }}>
      <EarnStack.Screen name={`${MOBILE_ROUTES.earn}-screen`} component={EarnScreen} />
    </EarnStack.Navigator>
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
            header: headerAlpha
          }}
        />
      </Web3Stack.Navigator>
    </DappsProvider>
  )
}

const EmailLoginStackScreen = () => {
  return (
    <EmailLoginProvider>
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
    </EmailLoginProvider>
  )
}

const JsonLoginStackScreen = () => {
  return (
    <JsonLoginProvider>
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
    </JsonLoginProvider>
  )
}

const AuthStack = () => {
  const { vaultStatus } = useVault()
  const { getItem } = useStorageController()

  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  const initialRouteName =
    vaultStatus === VAULT_STATUS.NOT_INITIALIZED
      ? MOBILE_ROUTES.addReferral
      : // Checks whether there is a pending email login attempt. It happens when user
      // request email login and closes the app. When the app is opened
      // the second time - an immediate email login attempt will be triggered.
      getItem('pendingLoginEmail')
      ? MOBILE_ROUTES.ambireAccountLogin
      : `${MOBILE_ROUTES.auth}-screen`

  return (
    <Stack.Navigator screenOptions={{ header: headerBeta }}>
      {vaultStatus === VAULT_STATUS.NOT_INITIALIZED && (
        <>
          <Stack.Screen
            name={MOBILE_ROUTES.addReferral}
            options={{ title: routesConfig[ROUTES.addReferral].title }}
            component={AddReferralScreen}
          />
          <Stack.Screen
            name={MOBILE_ROUTES.getStarted}
            options={{ title: routesConfig[ROUTES.getStarted].title }}
            component={VaultSetupGetStartedScreen}
          />
          <Stack.Screen
            name={MOBILE_ROUTES.createVault}
            options={{ title: routesConfig[ROUTES.createVault].title }}
            component={CreateNewVaultScreen}
          />
        </>
      )}
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

const VaultStack = () => {
  const { vaultStatus, unlockVault, biometricsEnabled, resetVault } = useVault()

  useEffect(() => {
    if (vaultStatus === VAULT_STATUS.LOADING) return

    SplashScreen.hideAsync()
  }, [vaultStatus])

  if (vaultStatus === VAULT_STATUS.LOADING) return null

  const renderResetVaultScreen = useCallback<(props: any) => JSX.Element>(
    (props) => <ResetVaultScreen {...props} vaultStatus={vaultStatus} resetVault={resetVault} />,
    [resetVault, vaultStatus]
  )

  const renderUnlockVaultScreen = useCallback<(props: any) => JSX.Element>(
    (props) => (
      <UnlockVaultScreen
        {...props}
        unlockVault={unlockVault}
        vaultStatus={vaultStatus}
        biometricsEnabled={biometricsEnabled}
      />
    ),
    [biometricsEnabled, unlockVault, vaultStatus]
  )

  return (
    <Stack.Navigator screenOptions={{ header: headerBeta }} initialRouteName="unlockVault">
      <Stack.Screen
        name={MOBILE_ROUTES.unlockVault}
        options={{ title: routesConfig[ROUTES.unlockVault].title }}
        component={renderUnlockVaultScreen}
      />
      <Stack.Screen
        name={MOBILE_ROUTES.resetVault}
        options={{ title: routesConfig[ROUTES.resetVault].title }}
        component={renderResetVaultScreen}
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
  const { eligibleRequests } = useRequests()
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
        name={MOBILE_ROUTES.gasTank}
        options={{
          tabBarLabel: routesConfig[ROUTES.gasTank].title,
          headerTitle: routesConfig[ROUTES.gasTank].title,
          tabBarIcon: ({ color }) => (
            <GasTankIcon color={color} width={tabsIconSize} height={tabsIconSize} />
          )
        }}
        component={GasTankScreen}
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
            <View>
              <TransferIcon color={color} width={tabsIconSize} height={tabsIconSize} />
              {eligibleRequests.length > 0 && (
                <View style={styles.transactionsBadge}>
                  <Text fontSize={10} weight="medium">
                    {eligibleRequests.length}
                  </Text>
                </View>
              )}
            </View>
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

  const renderPendingTransactionsScreen = useCallback<(props: any) => JSX.Element>((props) => {
    return (
      <PendingTransactionsProvider>
        <PendingTransactionsScreen {...props} />
      </PendingTransactionsProvider>
    )
  }, [])

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
        options={{ headerShown: false }}
        name={MOBILE_ROUTES.signers}
        component={SignersStackScreen}
      />
      <MainStack.Screen
        name={MOBILE_ROUTES.dataDeletionPolicy}
        component={DataDeletionPolicyStackScreen}
        options={{ headerShown: false }}
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
        component={renderPendingTransactionsScreen}
        options={{ title: routesConfig[ROUTES.pendingTransactions].title }}
      />
      <MainStack.Screen
        name={MOBILE_ROUTES.signMessage}
        component={SignMessageScreen}
        options={{ title: routesConfig[ROUTES.signMessage].title }}
      />
      <MainStack.Screen
        name={MOBILE_ROUTES.earn}
        component={EarnStackScreen}
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
  const { vaultStatus } = useVault()

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

    if (vaultStatus === VAULT_STATUS.UNLOCKED || vaultStatus === VAULT_STATUS.LOCKED_TEMPORARILY) {
      return (
        <OnboardingOnFirstLoginProvider>
          <AppStack />
        </OnboardingOnFirstLoginProvider>
      )
    }
  }

  // authStatus === AUTH_STATUS.LOADING or anything else:
  return null
}

export default Router
