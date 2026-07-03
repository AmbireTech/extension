import React, { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Route, Routes, useLocation } from 'react-router-dom'

import NoConnectionScreen from '@common/modules/no-connection/screens/NoConnectionScreen'
import AuthenticatedRoute from '@common/modules/router/components/AuthenticatedRoute'
import KeystoreUnlockedRoute from '@common/modules/router/components/KeystoreUnlockedRoute'
import routesConfig from '@common/modules/router/config/routesConfig'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import Splash from '@web/components/Splash'
import NavMenu from '@web/modules/router/components/NavMenu'
import TabOnlyRoute from '@web/modules/router/components/TabOnlyRoute'
import { SettingsRoutesProvider } from '@web/modules/settings/contexts/SettingsRoutesContext'

// Lazy load all routes
const AccountPersonalizeScreen = lazy(
  () => import('@web/modules/account-personalize/screens/AccountPersonalizeScreen')
)
const AccountPickerScreen = lazy(
  () => import('@web/modules/account-picker/screens/AccountPickerScreen')
)
const AccountSelectScreen = lazy(
  () => import('@web/modules/account-select/screens/AccountSelectScreen')
)
const AddOrUpdateNetworkScreen = lazy(
  () => import('@web/modules/action-requests/screens/AddOrUpdateNetworkScreen')
)
const BenzinScreen = lazy(() => import('@web/modules/action-requests/screens/BenzinScreen'))
const DappConnectScreen = lazy(
  () => import('@web/modules/action-requests/screens/DappConnectScreen')
)
const DecryptRequestScreen = lazy(
  () => import('@web/modules/action-requests/screens/DecryptRequestScreen')
)
const GetEncryptionPublicKeyRequestScreen = lazy(
  () => import('@web/modules/action-requests/screens/GetEncryptionPublicKeyRequestScreen')
)
const SwitchAccountScreen = lazy(
  () => import('@web/modules/action-requests/screens/SwitchAccountScreen')
)
const WatchTokenRequestScreen = lazy(
  () => import('@web/modules/action-requests/screens/WatchTokenRequestScreen')
)
const CreateSeedPhrasePrepareScreen = lazy(
  () => import('@web/modules/auth/screens/CreateSeedPhrasePrepareScreen')
)
const CreateSeedPhraseWriteScreen = lazy(
  () => import('@web/modules/auth/screens/CreateSeedPhraseWriteScreen')
)
const EmailAccountScreen = lazy(() => import('@web/modules/auth/screens/EmailAccountScreen'))
const EmailLoginScreen = lazy(() => import('@web/modules/auth/screens/EmailLoginScreen'))
const EmailRegisterScreen = lazy(() => import('@web/modules/auth/screens/EmailRegisterScreen'))
const GetStartedScreen = lazy(() => import('@web/modules/auth/screens/GetStartedScreen'))
const ImportExistingAccountSelectorScreen = lazy(
  () => import('@web/modules/auth/screens/ImportExistingAccountSelectorScreen')
)
const ImportSmartAccountJsonScreen = lazy(
  () => import('@web/modules/auth/screens/ImportSmartAccountJson')
)
const OnboardingCompletedScreen = lazy(
  () => import('@web/modules/auth/screens/OnboardingCompletedScreen')
)
const PrivateKeyImportScreen = lazy(
  () => import('@web/modules/auth/screens/PrivateKeyImportScreen')
)
const SafeImportScreen = lazy(() => import('@web/modules/auth/screens/SafeImportScreen'))
const SeedPhraseImportScreen = lazy(
  () => import('@web/modules/auth/screens/SeedPhraseImportScreen')
)
const ViewOnlyAccountAdderScreen = lazy(
  () => import('@web/modules/auth/screens/ViewOnlyAccountAdderScreen')
)
const InternalLogsScreen = lazy(() => import('@web/modules/debug/screens/InternalLogsScreen'))
const ExploreScreen = lazy(() => import('@web/modules/explore/screens/ExploreScreen'))
const ExploreSectionScreen = lazy(() => import('@web/modules/explore/screens/ExploreSectionScreen'))
const ExtensionRewardsScreen = lazy(
  () => import('@web/modules/extension-rewards/screens/ExtensionRewardsScreen')
)
const LedgerConnectScreen = lazy(
  () => import('@web/modules/hardware-wallet/screens/LedgerConnectScreen/LedgerConnectScreen')
)
const QrCameraPermissionPage = lazy(
  () => import('@web/modules/hardware-wallet/screens/QrCameraPermissionPage')
)
const QrConnectScreen = lazy(
  () => import('@web/modules/hardware-wallet/screens/QrConnectScreen/QrConnectScreen')
)
const KeyStoreEmailRecoveryScreen = lazy(
  () =>
    import('@web/modules/keystore/screens/KeyStoreEmailRecoveryScreen/KeyStoreEmailRecoveryScreen')
)
const KeyStoreEmailRecoverySetNewPasswordScreen = lazy(
  () => import('@web/modules/keystore/screens/KeyStoreEmailRecoverySetNewPasswordScreen')
)
const KeyStoreSetupScreen = lazy(() => import('@web/modules/keystore/screens/KeyStoreSetupScreen'))
const NetworksConfiguration = lazy(() => import('@web/modules/network-settings/screens'))
const PrivacyOptOutsConfiguration = lazy(
  () => import('@web/modules/network-settings/screens/PrivacyOptOutsConfiguration')
)
const NetworksScreen = lazy(() => import('@web/modules/networks/screens'))
const ReceiveScreen = lazy(() => import('@web/modules/receive/screens/ReceiveScreen'))
const AboutSettingsScreen = lazy(() => import('@web/modules/settings/screens/AboutSettingsScreen'))
const AccountsSettingsScreen = lazy(
  () => import('@web/modules/settings/screens/AccountsSettingsScreen')
)
const AddressBookSettingsScreen = lazy(
  () => import('@web/modules/settings/screens/AddressBookSettingsScreen')
)
const DevicePasswordChangeSettingsScreen = lazy(
  () => import('@web/modules/settings/screens/DevicePasswordChangeSettingsScreen')
)
const DevicePasswordRecoverySettingsScreen = lazy(
  () => import('@web/modules/settings/screens/DevicePasswordRecoverySettingsScreen')
)
const DevicePasswordSetSettingsScreen = lazy(
  () => import('@web/modules/settings/screens/DevicePasswordSetSettingsScreen')
)
const GeneralSettingsScreen = lazy(
  () => import('@web/modules/settings/screens/GeneralSettingsScreen')
)
const ManageTokensSettingsScreen = lazy(
  () => import('@web/modules/settings/screens/ManageTokensSettingsScreen')
)
const NetworksSettingsScreen = lazy(
  () => import('@web/modules/settings/screens/NetworksSettingsScreen')
)
const OptOutsScreen = lazy(() => import('@web/modules/settings/screens/OptOutsScreen'))
const RecoveryPhrasesSettingsScreen = lazy(
  () => import('@web/modules/settings/screens/RecoveryPhrasesSettingsScreen')
)
const SignedMessageHistorySettingsScreen = lazy(
  () => import('@web/modules/settings/screens/SignedMessageHistorySettingsScreen')
)
const TermsSettingsScreen = lazy(() => import('@web/modules/settings/screens/TermsSettingsScreen'))
const TransactionHistorySettingsScreen = lazy(
  () => import('@web/modules/settings/screens/TransactionHistorySettingsScreen')
)
const SignAccountOpScreen = lazy(
  () => import('@web/modules/sign-account-op/screens/SignAccountOpScreen')
)
const SignMessageScreen = lazy(() => import('@web/modules/sign-message/screens/SignMessageScreen'))
const SurveyScreen = lazy(() => import('@web/modules/survey/screens/SurveyScreen/SurveyScreen'))
const SwapAndBridgeScreen = lazy(
  () => import('@web/modules/swap-and-bridge/screens/SwapAndBridgeScreen')
)
const TokenDetailsScreen = lazy(
  () => import('@web/modules/token-details/screens/TokenDetailsScreen')
)
const TransferScreen = lazy(() => import('@web/modules/transfer/screens/TransferScreen'))

const MainRoutes = () => {
  const location = useLocation()
  const { t } = useTranslation()

  useEffect(() => {
    const trimmedPathName = location.pathname.replace(/^\/|\/$/g, '')
    const routeConfig = routesConfig[trimmedPathName as keyof typeof routesConfig]
    const withTitlePrefix = routeConfig?.withTitlePrefix ?? true
    const title = `${withTitlePrefix ? 'Ambire ' : ''}${routeConfig?.name || t('Wallet')}`

    document.title = title
  }, [location.pathname, t])

  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path={WEB_ROUTES.noConnection} element={<NoConnectionScreen />} />

        <Route element={<TabOnlyRoute />}>
          <Route path={WEB_ROUTES.internalLogs} element={<InternalLogsScreen />} />
          <Route path={WEB_ROUTES.networksConfiguration} element={<NetworksConfiguration />} />
          <Route
            path={WEB_ROUTES.privacyOptOutsConfiguration}
            element={<PrivacyOptOutsConfiguration />}
          />
          <Route path={WEB_ROUTES.keyStoreSetup} element={<KeyStoreSetupScreen />} />
          <Route
            path={WEB_ROUTES.keyStoreEmailRecovery}
            element={<KeyStoreEmailRecoveryScreen />}
          />
          <Route
            path={WEB_ROUTES.keyStoreEmailRecoverySetNewPassword}
            element={<KeyStoreEmailRecoverySetNewPasswordScreen />}
          />

          <Route element={<KeystoreUnlockedRoute />}>
            <Route path={WEB_ROUTES.getStarted} element={<GetStartedScreen />} />
            <Route path={WEB_ROUTES.authEmailAccount} element={<EmailAccountScreen />} />
            <Route path={WEB_ROUTES.authEmailLogin} element={<EmailLoginScreen />} />
            <Route path={WEB_ROUTES.authEmailRegister} element={<EmailRegisterScreen />} />
            <Route
              path={WEB_ROUTES.viewOnlyAccountAdder}
              element={<ViewOnlyAccountAdderScreen />}
            />

            <Route
              path={WEB_ROUTES.importExistingAccount}
              element={<ImportExistingAccountSelectorScreen />}
            />
            <Route path={WEB_ROUTES.ledgerConnect} element={<LedgerConnectScreen />} />
            <Route path={WEB_ROUTES.safeImport} element={<SafeImportScreen />} />
            <Route path={WEB_ROUTES.qrConnect} element={<QrConnectScreen />} />
            <Route path={WEB_ROUTES.importPrivateKey} element={<PrivateKeyImportScreen />} />
            <Route path={WEB_ROUTES.importSeedPhrase} element={<SeedPhraseImportScreen />} />
            <Route
              path={WEB_ROUTES.importSmartAccountJson}
              element={<ImportSmartAccountJsonScreen />}
            />

            <Route
              path={WEB_ROUTES.createSeedPhrasePrepare}
              element={<CreateSeedPhrasePrepareScreen />}
            />
            <Route
              path={WEB_ROUTES.createSeedPhraseWrite}
              element={<CreateSeedPhraseWriteScreen />}
            />

            <Route path={WEB_ROUTES.accountPicker} element={<AccountPickerScreen />} />
            <Route path={WEB_ROUTES.accountPersonalize} element={<AccountPersonalizeScreen />} />
            <Route path={WEB_ROUTES.onboardingCompleted} element={<OnboardingCompletedScreen />} />
            <Route path={WEB_ROUTES.qrPermission} element={<QrCameraPermissionPage />} />

            <Route element={<AuthenticatedRoute />}>
              <Route element={<SettingsRoutesProvider />}>
                <Route path={WEB_ROUTES.generalSettings} element={<GeneralSettingsScreen />} />
                <Route path={WEB_ROUTES.accountsSettings} element={<AccountsSettingsScreen />} />
                <Route
                  path={WEB_ROUTES.recoveryPhrasesSettings}
                  element={<RecoveryPhrasesSettingsScreen />}
                />
                <Route path={WEB_ROUTES.networksSettings} element={<NetworksSettingsScreen />} />
                <Route
                  path={WEB_ROUTES.transactions}
                  element={<TransactionHistorySettingsScreen />}
                />
                <Route
                  path={WEB_ROUTES.signedMessages}
                  element={<SignedMessageHistorySettingsScreen />}
                />
                <Route
                  path={WEB_ROUTES.devicePasswordSet}
                  element={<DevicePasswordSetSettingsScreen />}
                />
                <Route
                  path={WEB_ROUTES.devicePasswordChange}
                  element={<DevicePasswordChangeSettingsScreen />}
                />
                <Route
                  path={WEB_ROUTES.devicePasswordRecovery}
                  element={<DevicePasswordRecoverySettingsScreen />}
                />
                <Route path={WEB_ROUTES.optOuts} element={<OptOutsScreen />} />
                <Route path={WEB_ROUTES.manageTokens} element={<ManageTokensSettingsScreen />} />
                <Route path={WEB_ROUTES.addressBook} element={<AddressBookSettingsScreen />} />
                <Route path={WEB_ROUTES.settingsTerms} element={<TermsSettingsScreen />} />
                <Route path={WEB_ROUTES.settingsAbout} element={<AboutSettingsScreen />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route element={<KeystoreUnlockedRoute />}>
          <Route element={<AuthenticatedRoute />}>
            <Route path={WEB_ROUTES.transfer} element={<TransferScreen />} />
            <Route path={WEB_ROUTES.topUpGasTank} element={<TransferScreen isTopUpScreen />} />
            <Route path={WEB_ROUTES.signAccountOp} element={<SignAccountOpScreen />} />
            <Route path={WEB_ROUTES.swapAndBridge} element={<SwapAndBridgeScreen />} />
            <Route path={WEB_ROUTES.signMessage} element={<SignMessageScreen />} />
            <Route path={WEB_ROUTES.benzin} element={<BenzinScreen />} />
            <Route path={WEB_ROUTES.switchAccount} element={<SwitchAccountScreen />} />

            <Route path={WEB_ROUTES.dappConnectRequest} element={<DappConnectScreen />} />
            <Route path={WEB_ROUTES.addChain} element={<AddOrUpdateNetworkScreen />} />
            <Route path={WEB_ROUTES.watchAsset} element={<WatchTokenRequestScreen />} />

            <Route
              path={WEB_ROUTES.getEncryptionPublicKeyRequest}
              element={<GetEncryptionPublicKeyRequestScreen />}
            />
            <Route path={WEB_ROUTES.decryptRequest} element={<DecryptRequestScreen />} />

            <Route path={WEB_ROUTES.menu} element={<NavMenu />} />
            <Route path={WEB_ROUTES.tokenDetails} element={<TokenDetailsScreen />} />
            <Route path={WEB_ROUTES.accountSelect} element={<AccountSelectScreen />} />
            <Route path={WEB_ROUTES.receive} element={<ReceiveScreen />} />
            <Route path={WEB_ROUTES.explore} element={<ExploreScreen />} />
            <Route path={WEB_ROUTES.exploreSection} element={<ExploreSectionScreen />} />
            <Route path={WEB_ROUTES.networks} element={<NetworksScreen />} />
            <Route path={WEB_ROUTES.rewards} element={<ExtensionRewardsScreen />} />
            <Route path={WEB_ROUTES.survey} element={<SurveyScreen />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default MainRoutes
